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

// functions/src/recognize.ts
var recognize_exports = {};
__export(recognize_exports, {
  handler: () => handler,
  mediaTypeFor: () => mediaTypeFor
});
module.exports = __toCommonJS(recognize_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var s3 = new import_client_s3.S3Client({});
function mediaTypeFor(contentType) {
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
var handler = async (event) => {
  const bucket = process.env.UPLOAD_BUCKET;
  if (!bucket) throw new Error("UPLOAD_BUCKET not set");
  const out = await s3.send(
    new import_client_s3.GetObjectCommand({ Bucket: bucket, Key: event.imageKey })
  );
  const bytes = await out.Body.transformToByteArray();
  const imageBase64 = Buffer.from(bytes).toString("base64");
  return {
    imageBase64,
    imageMediaType: mediaTypeFor(out.ContentType),
    imageKey: event.imageKey
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler,
  mediaTypeFor
});
