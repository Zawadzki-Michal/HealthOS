import type { Env } from "./types";

function restHeaders(env: Env): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
}

// Inserts a single row and returns it back (RETURNING via Prefer:
// return=representation), so callers can report the new row's id.
export async function insertRow<T = Record<string, unknown>>(
  env: Env,
  table: string,
  row: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...restHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase insert into ${table} failed: ${response.status} ${body}`);
  }
  const rows = (await response.json()) as T[];
  return rows[0];
}

export async function selectRows<T = Record<string, unknown>>(
  env: Env,
  table: string,
  params: URLSearchParams,
): Promise<T[]> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
    headers: restHeaders(env),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase select from ${table} failed: ${response.status} ${body}`);
  }
  return (await response.json()) as T[];
}

// Uploads to Supabase Storage. `path` is the object path within `bucket`,
// e.g. 'progress/<user_id>/<week_of>-<angle>.jpg'.
export async function uploadObject(
  env: Env,
  bucket: string,
  path: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<void> {
  const response = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase storage upload to ${bucket}/${path} failed: ${response.status} ${body}`);
  }
}
