import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { EnrichEvent } from "./enrich.js";

// First step of the bottle pipeline: pull the uploaded label image from S3 and
// hand it to the enrich step as base64. Kept separate so enrich stays pure.

const s3 = new S3Client({});

export type SupportedMedia = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

// Map an S3 object ContentType to a media type the Anthropic vision API accepts.
// The upload input is accept="image/*", so png/gif/webp all reach here — passing
// the real type through (not forcing jpeg) is required or the API rejects the
// request when the declared type doesn't match the bytes. Unknown types fall
// back to jpeg as a best effort.
export function mediaTypeFor(contentType?: string): SupportedMedia {
  const ct = (contentType ?? "").split(";")[0].trim().toLowerCase();
  switch (ct) {
    case "image/png":
      return "image/png";
    case "image/gif":
      return "image/gif";
    case "image/webp":
      return "image/webp";
    case "image/jpeg":
    case "image/jpg":
    default:
      return "image/jpeg";
  }
}

export const handler = async (event: { imageKey: string }): Promise<EnrichEvent> => {
  const bucket = process.env.UPLOAD_BUCKET;
  if (!bucket) throw new Error("UPLOAD_BUCKET not set");

  const out = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: event.imageKey })
  );
  const bytes = await out.Body!.transformToByteArray();
  const imageBase64 = Buffer.from(bytes).toString("base64");

  return {
    imageBase64,
    imageMediaType: mediaTypeFor(out.ContentType),
    imageKey: event.imageKey,
  };
};
