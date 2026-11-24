import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = "attachments";
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required by the attachments signer",
  );
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,content-type",
  "Access-Control-Max-Age": "86400",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const isValidKey = (key: string, userId: string) =>
  key.startsWith(`${userId}/`) &&
  key.length > userId.length + 1 &&
  key.length <= 1024 &&
  !key.includes("..") &&
  !key.includes("\0");

const authorize = async (request: Request): Promise<string | null> => {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: header, apikey: SUPABASE_ANON_KEY },
    });
    if (!response.ok) return null;
    const user = (await response.json()) as { id?: string };
    return user.id ?? null;
  } catch {
    return null;
  }
};

interface SignBody {
  key?: unknown;
  op?: unknown;
  contentType?: unknown;
  expiresIn?: unknown;
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") return json({ ok: true });

    const userId = await authorize(request);
    if (!userId) return json({ error: "unauthorized" }, 401);

    if (request.method === "POST" && url.pathname === "/sign") {
      let body: SignBody;
      try {
        body = (await request.json()) as SignBody;
      } catch {
        return json({ error: "invalid JSON body" }, 400);
      }

      const key = String(body.key ?? "");
      const op = body.op === "put" ? "put" : body.op === "get" ? "get" : null;
      if (!op || !isValidKey(key, userId)) {
        return json({ error: "invalid key or operation" }, 400);
      }

      const expiresIn = Math.min(
        Math.max(Math.trunc(Number(body.expiresIn) || 3600), 60),
        3600,
      );

      const command =
        op === "put"
          ? new PutObjectCommand({
              Bucket: BUCKET,
              Key: key,
              ContentType: String(body.contentType || "application/octet-stream"),
              CacheControl: "3600",
            })
          : new GetObjectCommand({ Bucket: BUCKET, Key: key });

      try {
        const signed = await getSignedUrl(s3, command, { expiresIn });
        return json({ url: signed });
      } catch (error) {
        return json(
          { error: error instanceof Error ? error.message : "signing failed" },
          500,
        );
      }
    }

    if (request.method === "DELETE" && url.pathname === "/object") {
      const key = url.searchParams.get("key") ?? "";
      if (!isValidKey(key, userId)) {
        return json({ error: "invalid key" }, 400);
      }
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
        return json({ ok: true });
      } catch (error) {
        return json(
          { error: error instanceof Error ? error.message : "delete failed" },
          500,
        );
      }
    }

    return json({ error: "not found" }, 404);
  },
};
