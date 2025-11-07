import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

// Custom S3 client using user's AWS credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "player-archive-photos-2025";

/**
 * Upload file to custom S3 bucket
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const key = `${nanoid()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { key, url };
}

/**
 * Get signed URL for private files (if needed)
 */
export async function getSignedS3Url(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a random file key with prefix
 */
export function generateFileKey(prefix: string, extension: string): string {
  return `${prefix}/${nanoid()}.${extension}`;
}
