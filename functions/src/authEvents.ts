import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { doc } from "./lib/ddb.js";
import { TABLE, keys } from "./lib/keys.js";

// Cognito PostAuthentication trigger: stamp last-login + a running count per user.
// Cognito's ListUsers exposes no sign-in time, so we persist our own under
// PK="USER#<sub>" SK="#LOGIN" and surface it in the admin Users detail view.
// Must return the event unchanged (and never throw — a failure here would block
// the user's sign-in), so all work is best-effort.

interface PostAuthEvent {
  userName?: string;
  request?: { userAttributes?: Record<string, string> };
}

export const handler = async (event: PostAuthEvent): Promise<PostAuthEvent> => {
  try {
    const userId = event.request?.userAttributes?.sub ?? event.userName;
    if (userId) {
      const now = new Date().toISOString();
      await doc.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: keys.userLogin(userId),
          UpdateExpression: "SET lastLogin = :now, #t = :t ADD loginCount :one",
          ExpressionAttributeNames: { "#t": "type" },
          ExpressionAttributeValues: { ":now": now, ":t": "UserLogin", ":one": 1 },
        })
      );
    }
  } catch (err) {
    // Never block sign-in on a logging failure.
    console.error("postAuth login stamp failed", err);
  }
  return event;
};
