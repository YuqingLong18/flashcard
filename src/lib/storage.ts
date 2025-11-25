import {
  PutObjectCommand,
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  type ObjectCannedACL,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const bucket = process.env.STORAGE_BUCKET;
const publicBase = process.env.STORAGE_PUBLIC_BASE;
const rawObjectAcl = process.env.STORAGE_OBJECT_ACL?.trim();

const allowedAcls: Set<ObjectCannedACL> = new Set([
  "private",
  "public-read",
  "public-read-write",
  "authenticated-read",
  "aws-exec-read",
  "bucket-owner-read",
  "bucket-owner-full-control",
]);

const objectAcl =
  rawObjectAcl && allowedAcls.has(rawObjectAcl as ObjectCannedACL)
    ? (rawObjectAcl as ObjectCannedACL)
    : undefined;

if (rawObjectAcl && !objectAcl) {
  console.warn(
    `STORAGE_OBJECT_ACL "${rawObjectAcl}" is not a recognised canned ACL; ignoring value.`,
  );
}

if (!bucket) {
  console.warn("STORAGE_BUCKET is not configured. Upload endpoints will fail.");
}

const s3 = new S3Client({
  region: process.env.STORAGE_REGION ?? "auto",
  endpoint: process.env.STORAGE_ENDPOINT,
  forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === "true",
  credentials:
    process.env.STORAGE_ACCESS_KEY && process.env.STORAGE_SECRET_KEY
      ? {
          accessKeyId: process.env.STORAGE_ACCESS_KEY,
          secretAccessKey: process.env.STORAGE_SECRET_KEY,
        }
      : undefined,
});

export function buildObjectKey(filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
  const uuid = randomUUID();
  return `uploads/${uuid}-${safeName}`;
}

/**
 * Constructs the public URL for an object stored in MinIO/S3.
 * For MinIO with path-style URLs, the format is: endpoint/bucket/key
 */
function getMinIOPublicUrl(key: string): string {
  if (!bucket) {
    throw new Error("STORAGE_BUCKET is not configured");
  }
  
  const endpoint = process.env.STORAGE_ENDPOINT;
  if (!endpoint) {
    throw new Error("STORAGE_ENDPOINT is not configured");
  }
  
  // Remove trailing slash from endpoint
  const cleanEndpoint = endpoint.replace(/\/$/, "");
  
  // For path-style URLs (MinIO default), format is: endpoint/bucket/key
  return `${cleanEndpoint}/${bucket}/${key}`;
}

export function getPublicUrl(key: string) {
  // If publicBase is configured, use it (assumes it's a CDN/proxy that serves from MinIO)
  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${key}`;
  }
  
  // Fallback: construct URL directly from MinIO endpoint
  // Note: This only works if MinIO is publicly accessible
  return getMinIOPublicUrl(key);
}

/**
 * Extracts the storage key from a stored URL.
 * Handles both public base URLs and MinIO direct URLs.
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }
  
  // Try to extract key from public base URL
  if (publicBase) {
    const base = publicBase.replace(/\/$/, "");
    if (url.startsWith(base + "/")) {
      return url.slice(base.length + 1);
    }
  }
  
  // Try to extract key from MinIO endpoint URL
  const endpoint = process.env.STORAGE_ENDPOINT;
  if (endpoint && bucket) {
    const cleanEndpoint = endpoint.replace(/\/$/, "");
    const prefix = `${cleanEndpoint}/${bucket}/`;
    if (url.startsWith(prefix)) {
      return url.slice(prefix.length);
    }
  }
  
  // If it doesn't match any known pattern, assume it's already a key
  if (!url.includes("://")) {
    return url;
  }
  
  return null;
}

/**
 * Gets the public URL for an image, with fallback to proxy endpoint if public base fails.
 * This function can convert stored URLs to use the proxy endpoint for reliable access.
 */
export function getImageUrl(keyOrUrl: string): string {
  // If it's already a full URL, try to extract the key and use proxy
  if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
    const key = extractKeyFromUrl(keyOrUrl);
    if (key) {
      // Use proxy endpoint for reliable access (works regardless of public base config)
      return `/api/image/proxy?key=${encodeURIComponent(key)}`;
    }
    // If we can't extract key, return as-is (might be external URL)
    return keyOrUrl;
  }
  
  // Otherwise, treat it as a key and use proxy endpoint
  return `/api/image/proxy?key=${encodeURIComponent(keyOrUrl)}`;
}

export async function createUploadUrl({
  key,
  contentType,
  expiresIn = 900,
}: {
  key: string;
  contentType: string;
  expiresIn?: number;
}) {
  if (!bucket) {
    throw new Error("STORAGE_BUCKET is not configured");
  }

  // Ensure bucket exists before creating signed URL
  await ensureBucketExists();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ...(objectAcl ? { ACL: objectAcl } : {}),
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
  return {
    uploadUrl,
    publicUrl: getPublicUrl(key),
  };
}

async function ensureBucketExists() {
  if (!bucket) {
    throw new Error("STORAGE_BUCKET is not configured");
  }

  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    // Bucket exists, we're good
    return;
  } catch (error) {
    const errorCode = (error as { Code?: string })?.Code;
    if (errorCode === "NotFound" || errorCode === "NoSuchBucket") {
      // Try to create the bucket
      try {
        const region = process.env.STORAGE_REGION ?? "us-east-1";
        // Only set CreateBucketConfiguration for AWS S3 (not MinIO)
        if (!process.env.STORAGE_ENDPOINT && region !== "us-east-1") {
          await s3.send(
            new CreateBucketCommand({
              Bucket: bucket,
              CreateBucketConfiguration: {
                LocationConstraint: region as "us-west-2" | "us-west-1" | "eu-west-1" | "eu-central-1" | "ap-southeast-1" | "ap-northeast-1" | "ap-southeast-2" | "sa-east-1",
              },
            }),
          );
        } else {
          await s3.send(new CreateBucketCommand({ Bucket: bucket }));
        }
        console.log(`Created bucket: ${bucket}`);
      } catch (createError) {
        const createErrorCode = (createError as { Code?: string })?.Code;
        if (createErrorCode === "BucketAlreadyOwnedByYou") {
          // Bucket was created between check and create - that's fine
          return;
        }
        throw new Error(
          `Bucket "${bucket}" does not exist and could not be created automatically. ` +
            `Please create it manually in your storage service. ` +
            `If using MinIO, access the web UI at ${process.env.STORAGE_ENDPOINT || "http://localhost:9000"} ` +
            `or use: mc mb ${process.env.STORAGE_ENDPOINT?.replace(/^https?:\/\//, "") || "localhost"}/${bucket}. ` +
            `Error: ${createError instanceof Error ? createError.message : String(createError)}`,
        );
      }
    } else {
      // Re-throw other errors (permissions, network, etc.)
      throw error;
    }
  }
}

export async function uploadBuffer({
  buffer,
  key,
  contentType,
}: {
  buffer: Buffer;
  key: string;
  contentType: string;
}) {
  if (!bucket) {
    throw new Error("STORAGE_BUCKET is not configured");
  }

  // Ensure bucket exists before uploading
  await ensureBucketExists();

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ...(objectAcl ? { ACL: objectAcl } : {}),
      }),
    );
  } catch (error) {
    const errorCode = (error as { Code?: string; message?: string })?.Code;
    if (errorCode === "NoSuchBucket") {
      throw new Error(
        `Bucket "${bucket}" does not exist. ` +
          `Please create it in your storage service (MinIO/AWS S3/etc). ` +
          `If using MinIO, you can create it via the web UI at ${process.env.STORAGE_ENDPOINT || "http://localhost:9000"} ` +
          `or using: mc mb ${process.env.STORAGE_ENDPOINT || "localhost"}/${bucket}`,
      );
    }
    throw error;
  }

  return getPublicUrl(key);
}
