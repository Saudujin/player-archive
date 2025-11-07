import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "player-archive-photos-2025";

/**
 * Generate presigned URL for direct upload to S3
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const key = `${nanoid()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // 1 hour
  });

  const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, key, publicUrl };
}
