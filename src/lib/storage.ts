import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const bucket = process.env.STORAGE_BUCKET;
const publicBase = process.env.STORAGE_PUBLIC_BASE;

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

export function getPublicUrl(key: string) {
  if (!publicBase) {
    throw new Error("STORAGE_PUBLIC_BASE is not configured");
  }
  return `${publicBase.replace(/\/$/, "")}/${key}`;
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

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ACL: "public-read",
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
  return {
    uploadUrl,
    publicUrl: getPublicUrl(key),
  };
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

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    }),
  );

  return getPublicUrl(key);
}
