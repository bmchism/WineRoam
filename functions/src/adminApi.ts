import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersInGroupCommand,
  AdminGetUserCommand,
  AdminResetUserPasswordCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminDeleteUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { putItem, getItem, queryPartitionDesc } from "./lib/ddb.js";
import { keys } from "./lib/keys.js";

// admin-api: owner-only user management, exposed as AppSync resolvers and gated
// to the Cognito "admins" group. Destructive ops are deliberate two-step and
// every mutating action is written to a DynamoDB audit trail (PK="AUDIT").

const cognito = new CognitoIdentityProviderClient({});
const POOL = process.env.USER_POOL_ID!;
const ADMIN_GROUP = "admins";

interface AppSyncEvent {
  info: { fieldName: string };
  arguments: {
    username?: string;
    action?: string;
    value?: string;
    search?: string;
    nextToken?: string;
    limit?: number;
  };
  identity?: {
    username?: string;
    groups?: string[];
    claims?: Record<string, unknown>;
  };
}

function groupsOf(event: AppSyncEvent): string[] {
  return (
    event.identity?.groups ??
    (event.identity?.claims?.["cognito:groups"] as string[] | undefined) ??
    []
  );
}

function requireAdmin(event: AppSyncEvent) {
  if (!groupsOf(event).includes(ADMIN_GROUP)) {
    throw new Error("Not authorized (admins group required)");
  }
}

function actorOf(event: AppSyncEvent): string {
  return (
    event.identity?.username ??
    (event.identity?.claims?.["cognito:username"] as string | undefined) ??
    (event.identity?.claims?.sub as string | undefined) ??
    "unknown"
  );
}

async function audit(
  event: AppSyncEvent,
  action: string,
  target: string,
  detail?: string
) {
  const at = new Date().toISOString();
  await putItem({
    PK: "AUDIT",
    SK: `${at}#${target}`,
    type: "AuditLog",
    actor: actorOf(event),
    action,
    target,
    detail: detail ?? "",
    at,
  }).catch(() => {});
}

const attr = (u: any, name: string) =>
  u?.Attributes?.find((x: any) => x.Name === name)?.Value ??
  u?.UserAttributes?.find((x: any) => x.Name === name)?.Value;

export const handler = async (event: AppSyncEvent): Promise<any> => {
  requireAdmin(event);

  switch (event.info.fieldName) {
    case "adminListUsers":
      return listUsers(event);
    case "adminGetUser":
      return getUser(event);
    case "adminAuditLog":
      return auditLog(event);
    case "adminListFeedback":
      return listFeedback(event);
    case "adminUserAction":
      return userAction(event);
    default:
      throw new Error(`unknown field ${event.info.fieldName}`);
  }
};

async function listUsers(event: AppSyncEvent) {
  const search = event.arguments.search?.trim();
  const out = await cognito.send(
    new ListUsersCommand({
      UserPoolId: POOL,
      Limit: 60,
      PaginationToken: event.arguments.nextToken || undefined,
      Filter: search ? `email ^= "${search.replace(/"/g, "")}"` : undefined,
    })
  );

  // One call resolves admin-group membership for the whole page.
  const adminSet = await adminUsernames();

  const users = (out.Users ?? []).map((u) => ({
    username: u.Username,
    status: u.UserStatus,
    enabled: u.Enabled ?? true,
    email: attr(u, "email") ?? "",
    emailVerified: attr(u, "email_verified") === "true",
    createdAt: u.UserCreateDate?.toISOString() ?? "",
    lastModified: u.UserLastModifiedDate?.toISOString() ?? "",
    isAdmin: !!u.Username && adminSet.has(u.Username),
  }));

  return { users, nextToken: out.PaginationToken ?? null };
}

async function adminUsernames(): Promise<Set<string>> {
  const set = new Set<string>();
  try {
    let token: string | undefined;
    do {
      const g = await cognito.send(
        new ListUsersInGroupCommand({
          UserPoolId: POOL,
          GroupName: ADMIN_GROUP,
          Limit: 60,
          NextToken: token,
        })
      );
      for (const u of g.Users ?? []) if (u.Username) set.add(u.Username);
      token = g.NextToken;
    } while (token);
  } catch {
    /* group may not exist yet — treat as no admins */
  }
  return set;
}

async function getUser(event: AppSyncEvent) {
  const username = event.arguments.username;
  if (!username) throw new Error("username required");
  const u = await cognito.send(
    new AdminGetUserCommand({ UserPoolId: POOL, Username: username })
  );
  const mfaList = u.UserMFASettingList ?? [];
  const [adminSet, login] = await Promise.all([
    adminUsernames(),
    getItem<{ lastLogin?: string; loginCount?: number }>(keys.userLogin(username)).catch(() => undefined),
  ]);
  return {
    username: u.Username,
    status: u.UserStatus,
    enabled: u.Enabled ?? true,
    email: attr(u, "email") ?? "",
    emailVerified: attr(u, "email_verified") === "true",
    createdAt: u.UserCreateDate?.toISOString() ?? "",
    lastModified: u.UserLastModifiedDate?.toISOString() ?? "",
    mfaEnabled: mfaList.length > 0,
    preferredMfa: u.PreferredMfaSetting ?? "",
    lastLogin: login?.lastLogin ?? "",
    loginCount: login?.loginCount ?? 0,
    isAdmin: !!u.Username && adminSet.has(u.Username),
  };
}

async function auditLog(event: AppSyncEvent) {
  const limit = Math.min(500, Math.max(1, event.arguments.limit ?? 100));
  // SK is `<iso>#<target>`; ScanIndexForward:false yields newest-first.
  const rows = await queryPartitionDesc<{
    SK: string;
    actor?: string;
    action?: string;
    target?: string;
    detail?: string;
    at?: string;
  }>("AUDIT", limit);
  return rows.map((r) => ({
    at: r.at ?? r.SK.split("#")[0],
    actor: r.actor ?? "unknown",
    action: r.action ?? "",
    target: r.target ?? "",
    detail: r.detail ?? "",
  }));
}

async function listFeedback(event: AppSyncEvent) {
  const limit = Math.min(500, Math.max(1, event.arguments.limit ?? 100));
  // SK is `<iso>#<uuid>`; ScanIndexForward:false yields newest-first.
  const rows = await queryPartitionDesc<{
    SK: string;
    category?: string;
    message?: string;
    email?: string | null;
    path?: string | null;
    at?: string;
  }>("FEEDBACK", limit);
  return rows.map((r) => ({
    id: r.SK,
    at: r.at ?? r.SK.split("#")[0],
    category: r.category ?? "Other",
    message: r.message ?? "",
    email: r.email ?? null,
    path: r.path ?? null,
  }));
}

async function userAction(event: AppSyncEvent): Promise<boolean> {
  const username = event.arguments.username;
  const action = event.arguments.action;
  const value = event.arguments.value;
  if (!username) throw new Error("username required");

  switch (action) {
    case "resetPassword":
      await cognito.send(
        new AdminResetUserPasswordCommand({ UserPoolId: POOL, Username: username })
      );
      break;
    case "disableUser":
      await cognito.send(
        new AdminDisableUserCommand({ UserPoolId: POOL, Username: username })
      );
      break;
    case "enableUser":
      await cognito.send(
        new AdminEnableUserCommand({ UserPoolId: POOL, Username: username })
      );
      break;
    case "deleteUser":
      await cognito.send(
        new AdminDisableUserCommand({ UserPoolId: POOL, Username: username })
      );
      await cognito.send(
        new AdminDeleteUserCommand({ UserPoolId: POOL, Username: username })
      );
      break;
    case "addAdmin":
      await cognito.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: POOL,
          Username: username,
          GroupName: ADMIN_GROUP,
        })
      );
      break;
    case "removeAdmin":
      await cognito.send(
        new AdminRemoveUserFromGroupCommand({
          UserPoolId: POOL,
          Username: username,
          GroupName: ADMIN_GROUP,
        })
      );
      break;
    case "resendInvite":
      await cognito.send(
        new AdminCreateUserCommand({
          UserPoolId: POOL,
          Username: username,
          MessageAction: "RESEND",
        })
      );
      break;
    case "setTempPassword": {
      if (!value) throw new Error("password value required");
      await cognito.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: POOL,
          Username: username,
          Password: value,
          Permanent: false,
        })
      );
      break;
    }
    default:
      throw new Error("unknown action");
  }

  await audit(event, action!, username);
  return true;
}
