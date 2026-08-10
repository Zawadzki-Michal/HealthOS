import type { McpTool } from "../mcpTypes";
import { textResult } from "../mcpTypes";
import { insertRow, uploadObject } from "../supabaseClient";
import { optionalString, requireString } from "../validate";

interface ProgressPhotoRow {
  id: string;
}

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB -- plenty for a phone check-in photo

const CONTENT_TYPE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/webp": "webp",
};

function decodeBase64(base64: string): Uint8Array {
  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw new Error("image_base64 is not valid base64");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export const logPhotoCheckin: McpTool = {
  name: "log_photo_checkin",
  description: "Log a weekly progress-photo check-in. Image bytes are passed as base64.",
  inputSchema: {
    type: "object",
    properties: {
      image_base64: { type: "string", description: "Raw image bytes, base64-encoded" },
      content_type: {
        type: "string",
        enum: Object.keys(CONTENT_TYPE_EXT),
        description: "defaults to image/jpeg",
      },
      week_of: { type: "string", format: "date", description: "the check-in week, YYYY-MM-DD" },
      angle: { type: "string", enum: ["front", "side", "back"] },
      body_measurement_id: { type: "string", format: "uuid" },
      notes: { type: "string" },
    },
    required: ["image_base64", "week_of"],
  },
  async handler(args, env) {
    const imageBase64 = requireString(args.image_base64, "image_base64");
    const weekOf = requireString(args.week_of, "week_of");
    const angle = optionalString(args.angle) ?? "front";
    const contentType = optionalString(args.content_type) ?? "image/jpeg";
    const ext = CONTENT_TYPE_EXT[contentType];
    if (!ext) {
      throw new Error(`content_type must be one of: ${Object.keys(CONTENT_TYPE_EXT).join(", ")}`);
    }

    const bytes = decodeBase64(imageBase64);
    if (bytes.byteLength === 0) {
      throw new Error("image_base64 decoded to zero bytes");
    }
    if (bytes.byteLength > MAX_PHOTO_BYTES) {
      throw new Error(`Image is too large (${bytes.byteLength} bytes, max ${MAX_PHOTO_BYTES})`);
    }

    const storagePath = `progress/${env.OWNER_USER_ID}/${weekOf}-${angle}.${ext}`;
    await uploadObject(env, "progress-photos", storagePath, bytes, contentType);

    const inserted = await insertRow<ProgressPhotoRow>(env, "progress_photos", {
      user_id: env.OWNER_USER_ID,
      storage_path: storagePath,
      week_of: weekOf,
      angle,
      body_measurement_id: optionalString(args.body_measurement_id),
      notes: optionalString(args.notes),
    });

    return textResult(`Logged ${angle} progress photo for week of ${weekOf} (id ${inserted.id}).`);
  },
};
