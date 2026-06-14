import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { TABLE } from "./keys.js";

const base = new DynamoDBClient({});
export const doc = DynamoDBDocumentClient.from(base, {
  marshallOptions: { removeUndefinedValues: true },
});

export async function getItem<T = Record<string, unknown>>(
  key: Record<string, unknown>
): Promise<T | undefined> {
  const out = await doc.send(new GetCommand({ TableName: TABLE, Key: key }));
  return out.Item as T | undefined;
}

export async function putItem(item: Record<string, unknown>) {
  await doc.send(new PutCommand({ TableName: TABLE, Item: item }));
  return item;
}

export async function deleteItem(key: Record<string, unknown>) {
  await doc.send(new DeleteCommand({ TableName: TABLE, Key: key }));
}

// Query a partition (optionally a SK prefix).
export async function queryPartition<T = Record<string, unknown>>(
  pk: string,
  skPrefix?: string
): Promise<T[]> {
  const out = await doc.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: skPrefix
        ? "PK = :pk AND begins_with(SK, :sk)"
        : "PK = :pk",
      ExpressionAttributeValues: skPrefix
        ? { ":pk": pk, ":sk": skPrefix }
        : { ":pk": pk },
    })
  );
  return (out.Items ?? []) as T[];
}

// Query a partition newest-first (descending SK), capped to `limit` rows.
// For append-only logs whose SK starts with a sortable timestamp.
export async function queryPartitionDesc<T = Record<string, unknown>>(
  pk: string,
  limit = 100
): Promise<T[]> {
  const out = await doc.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": pk },
      ScanIndexForward: false,
      Limit: limit,
    })
  );
  return (out.Items ?? []) as T[];
}

// Query the GSI1 partition (list bottles, join-code lookup).
export async function queryGsi1<T = Record<string, unknown>>(
  gsi1pk: string
): Promise<T[]> {
  const out = await doc.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "GSI1",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: { ":pk": gsi1pk },
    })
  );
  return (out.Items ?? []) as T[];
}

// Scan items of a given type with an optional filter (small-table use).
export async function scanByType<T = Record<string, unknown>>(
  type: string,
  extra?: { expr: string; values: Record<string, unknown> }
): Promise<T[]> {
  const out = await doc.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: extra ? `#t = :t AND (${extra.expr})` : "#t = :t",
      ExpressionAttributeNames: { "#t": "type" },
      ExpressionAttributeValues: { ":t": type, ...(extra?.values ?? {}) },
    })
  );
  return (out.Items ?? []) as T[];
}

export { UpdateCommand };
