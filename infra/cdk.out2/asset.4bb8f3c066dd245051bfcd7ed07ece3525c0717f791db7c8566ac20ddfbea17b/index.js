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

// functions/src/authEvents.ts
var authEvents_exports = {};
__export(authEvents_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(authEvents_exports);
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");

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

// functions/src/authEvents.ts
var handler = async (event) => {
  try {
    const userId = event.request?.userAttributes?.sub ?? event.userName;
    if (userId) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await doc.send(
        new import_lib_dynamodb2.UpdateCommand({
          TableName: TABLE,
          Key: keys.userLogin(userId),
          UpdateExpression: "SET lastLogin = :now, #t = :t ADD loginCount :one",
          ExpressionAttributeNames: { "#t": "type" },
          ExpressionAttributeValues: { ":now": now, ":t": "UserLogin", ":one": 1 }
        })
      );
    }
  } catch (err) {
    console.error("postAuth login stamp failed", err);
  }
  return event;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
