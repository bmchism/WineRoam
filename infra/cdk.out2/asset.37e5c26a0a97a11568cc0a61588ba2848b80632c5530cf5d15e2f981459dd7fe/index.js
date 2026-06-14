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

// functions/src/integrations.ts
var integrations_exports = {};
__export(integrations_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(integrations_exports);
var SOURCES = [
  {
    label: "Wine Matchmaker",
    base: "https://www.winematchmaker.com/search?q="
  },
  {
    label: "The Wine Report",
    base: "https://www.thewinereport.com/?s="
  }
];
var handler = async (event) => {
  const q = encodeURIComponent(event.name || event.brand);
  const sources = SOURCES.map((s) => ({
    label: s.label,
    url: `${s.base}${q}`
  }));
  return { sources };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
