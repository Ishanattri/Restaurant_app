import { z } from "zod";

/**
 * `z.coerce.boolean()` calls `Boolean(value)`, so the string "false" (as sent
 * by multipart/form-data bodies) coerces to `true` — any non-empty string is
 * truthy. This treats "false"/"true" strings correctly while still accepting
 * real booleans (e.g. from a JSON body).
 */
export const zBooleanString = z.preprocess((val) => {
  if (typeof val === "string") return val === "true";
  return val;
}, z.boolean());
