"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// functions/src/adminApi.ts
var adminApi_exports = {};
__export(adminApi_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(adminApi_exports);
var import_client_cognito_identity_provider = require("@aws-sdk/client-cognito-identity-provider");

// functions/src/lib/ddb.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");

// functions/src/lib/keys.ts
var TABLE = process.env.TABLE_NAME ?? "AgaveTable";
var keys = {
  bottle: (id) => ({ PK: `BOTTLE#${id}`, SK: "#META" }),
  bottleList: () => ({ gsi1pk: "BOTTLE" }),
  // Cache pointer: normalized "NOM#brand" (or label hash) -> bottleId. Permanent.
  cache: (cacheKey) => ({ PK: `CACHE#${cacheKey}`, SK: "#PTR" }),
  session: (sessionId) => ({ PK: `SESSION#${sessionId}`, SK: "#META" }),
  joinLookup: (code) => ({ gsi1pk: `JOIN#${code}` }),
  participant: (sessionId, participantId) => ({
    PK: `SESSION#${sessionId}`,
    SK: `PART#${participantId}`
  }),
  rating: (sessionId, bottleId, participantId) => ({
    PK: `SESSION#${sessionId}`,
    SK: `RATING#${bottleId}#${participantId}`
  }),
  quizResponse: (sessionId, participantId, questionId) => ({
    PK: `SESSION#${sessionId}`,
    SK: `QRESP#${participantId}#${questionId}`
  }),
  review: (bottleId, userId) => ({
    PK: `BOTTLE#${bottleId}`,
    SK: `REVIEW#${userId}`
  }),
  note: (userId, bottleId) => ({
    PK: `USER#${userId}`,
    SK: `NOTE#${bottleId}`
  }),
  profile: (userId) => ({ PK: `USER#${userId}`, SK: "#PROFILE" }),
  userLogin: (userId) => ({ PK: `USER#${userId}`, SK: "#LOGIN" }),
  userFlight: (userId, flightId) => ({
    PK: `USER#${userId}`,
    SK: `FLIGHT#${flightId}`
  }),
  userHistory: (userId, entryId) => ({
    PK: `USER#${userId}`,
    SK: `HIST#${entryId}`
  }),
  favorite: (userId, bottleId) => ({
    PK: `USER#${userId}`,
    SK: `FAV#${bottleId}`
  }),
  shelf: (userId, bottleId) => ({
    PK: `USER#${userId}`,
    SK: `SHELF#${bottleId}`
  }),
  pushSub: (userId, hash) => ({
    PK: `USER#${userId}`,
    SK: `PUSHSUB#${hash}`
  }),
  scan: (imageKey) => ({ PK: `SCAN#${imageKey}`, SK: "#SCAN" }),
  reminder: (userId, id) => ({
    PK: `USER#${userId}`,
    SK: `REMIND#${id}`
  }),
  analytics: (day) => ({ PK: "ANALYTICS", SK: day })
};

// functions/src/lib/ddb.ts
var base = new import_client_dynamodb.DynamoDBClient({});
var doc = import_lib_dynamodb.DynamoDBDocumentClient.from(base, {
  marshallOptions: { removeUndefinedValues: true }
});
async function getItem(key) {
  const out = await doc.send(new import_lib_dynamodb.GetCommand({ TableName: TABLE, Key: key }));
  return out.Item;
}
async function putItem(item) {
  await doc.send(new import_lib_dynamodb.PutCommand({ TableName: TABLE, Item: item }));
  return item;
}
async function queryPartitionDesc(pk, limit = 100) {
  const out = await doc.send(
    new import_lib_dynamodb.QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": pk },
      ScanIndexForward: false,
      Limit: limit
    })
  );
  return out.Items ?? [];
}

// functions/src/adminApi.ts
var cognito = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({});
var POOL = process.env.USER_POOL_ID;
var ADMIN_GROUP = "admins";
function groupsOf(event) {
  return event.identity?.groups ?? event.identity?.claims?.["cognito:groups"] ?? [];
}
function requireAdmin(event) {
  if (!groupsOf(event).includes(ADMIN_GROUP)) {
    throw new Error("Not authorized (admins group required)");
  }
}
function actorOf(event) {
  return event.identity?.username ?? event.identity?.claims?.["cognito:username"] ?? event.identity?.claims?.sub ?? "unknown";
}
async function audit(event, action, target, detail) {
  const at = (/* @__PURE__ */ new Date()).toISOString();
  await putItem({
    PK: "AUDIT",
    SK: `${at}#${target}`,
    type: "AuditLog",
    actor: actorOf(event),
    action,
    target,
    detail: detail ?? "",
    at
  }).catch(() => {
  });
}
var attr = (u, name) => u?.Attributes?.find((x) => x.Name === name)?.Value ?? u?.UserAttributes?.find((x) => x.Name === name)?.Value;
var handler = async (event) => {
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
async function listUsers(event) {
  const search = event.arguments.search?.trim();
  const out = await cognito.send(
    new import_client_cognito_identity_provider.ListUsersCommand({
      UserPoolId: POOL,
      Limit: 60,
      PaginationToken: event.arguments.nextToken || void 0,
      Filter: search ? `email ^= "${search.replace(/"/g, "")}"` : void 0
    })
  );
  const adminSet = await adminUsernames();
  const users = (out.Users ?? []).map((u) => ({
    username: u.Username,
    status: u.UserStatus,
    enabled: u.Enabled ?? true,
    email: attr(u, "email") ?? "",
    emailVerified: attr(u, "email_verified") === "true",
    createdAt: u.UserCreateDate?.toISOString() ?? "",
    lastModified: u.UserLastModifiedDate?.toISOString() ?? "",
    isAdmin: !!u.Username && adminSet.has(u.Username)
  }));
  return { users, nextToken: out.PaginationToken ?? null };
}
async function adminUsernames() {
  const set = /* @__PURE__ */ new Set();
  try {
    let token;
    do {
      const g = await cognito.send(
        new import_client_cognito_identity_provider.ListUsersInGroupCommand({
          UserPoolId: POOL,
          GroupName: ADMIN_GROUP,
          Limit: 60,
          NextToken: token
        })
      );
      for (const u of g.Users ?? []) if (u.Username) set.add(u.Username);
      token = g.NextToken;
    } while (token);
  } catch {
  }
  return set;
}
async function getUser(event) {
  const username = event.arguments.username;
  if (!username) throw new Error("username required");
  const u = await cognito.send(
    new import_client_cognito_identity_provider.AdminGetUserCommand({ UserPoolId: POOL, Username: username })
  );
  const mfaList = u.UserMFASettingList ?? [];
  const [adminSet, login] = await Promise.all([
    adminUsernames(),
    getItem(keys.userLogin(username)).catch(() => void 0)
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
    isAdmin: !!u.Username && adminSet.has(u.Username)
  };
}
async function auditLog(event) {
  const limit = Math.min(500, Math.max(1, event.arguments.limit ?? 100));
  const rows = await queryPartitionDesc("AUDIT", limit);
  return rows.map((r) => ({
    at: r.at ?? r.SK.split("#")[0],
    actor: r.actor ?? "unknown",
    action: r.action ?? "",
    target: r.target ?? "",
    detail: r.detail ?? ""
  }));
}
async function listFeedback(event) {
  const limit = Math.min(500, Math.max(1, event.arguments.limit ?? 100));
  const rows = await queryPartitionDesc("FEEDBACK", limit);
  return rows.map((r) => ({
    id: r.SK,
    at: r.at ?? r.SK.split("#")[0],
    category: r.category ?? "Other",
    message: r.message ?? "",
    email: r.email ?? null,
    path: r.path ?? null
  }));
}
async function userAction(event) {
  const username = event.arguments.username;
  const action = event.arguments.action;
  const value = event.arguments.value;
  if (!username) throw new Error("username required");
  switch (action) {
    case "resetPassword":
      await cognito.send(
        new import_client_cognito_identity_provider.AdminResetUserPasswordCommand({ UserPoolId: POOL, Username: username })
      );
      break;
    case "disableUser":
      await cognito.send(
        new import_client_cognito_identity_provider.AdminDisableUserCommand({ UserPoolId: POOL, Username: username })
      );
      break;
    case "enableUser":
      await cognito.send(
        new import_client_cognito_identity_provider.AdminEnableUserCommand({ UserPoolId: POOL, Username: username })
      );
      break;
    case "deleteUser":
      await cognito.send(
        new import_client_cognito_identity_provider.AdminDisableUserCommand({ UserPoolId: POOL, Username: username })
      );
      await cognito.send(
        new import_client_cognito_identity_provider.AdminDeleteUserCommand({ UserPoolId: POOL, Username: username })
      );
      break;
    case "addAdmin":
      await cognito.send(
        new import_client_cognito_identity_provider.AdminAddUserToGroupCommand({
          UserPoolId: POOL,
          Username: username,
          GroupName: ADMIN_GROUP
        })
      );
      break;
    case "removeAdmin":
      await cognito.send(
        new import_client_cognito_identity_provider.AdminRemoveUserFromGroupCommand({
          UserPoolId: POOL,
          Username: username,
          GroupName: ADMIN_GROUP
        })
      );
      break;
    case "resendInvite":
      await cognito.send(
        new import_client_cognito_identity_provider.AdminCreateUserCommand({
          UserPoolId: POOL,
          Username: username,
          MessageAction: "RESEND"
        })
      );
      break;
    case "setTempPassword": {
      if (!value) throw new Error("password value required");
      await cognito.send(
        new import_client_cognito_identity_provider.AdminSetUserPasswordCommand({
          UserPoolId: POOL,
          Username: username,
          Password: value,
          Permanent: false
        })
      );
      break;
    }
    default:
      throw new Error("unknown action");
  }
  await audit(event, action, username);
  return true;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
