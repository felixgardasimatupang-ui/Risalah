import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3ClientConfig,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

const config: S3ClientConfig = {
  endpoint: process.env.STORAGE_ENDPOINT || "localhost:9000",
  region: process.env.STORAGE_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY || "risalah",
    secretAccessKey: process.env.STORAGE_SECRET_KEY || "risalah-sekneg-minio",
  },
  forcePathStyle: true,
};

const useSSL = process.env.STORAGE_USE_SSL === "true";
if (useSSL) config.endpoint = `https://${config.endpoint}`;
else config.endpoint = `http://${config.endpoint}`;

let client: S3Client;

function getClient() {
  if (!client) client = new S3Client(config);
  return client;
}

const BUCKET = process.env.STORAGE_BUCKET || "risalah-audio";

export async function uploadFile(
  key: string,
  body: Buffer | Readable | string,
  contentType?: string,
) {
  const upload = new Upload({
    client: getClient(),
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
  });
  return upload.done();
}

export async function getFile(key: string) {
  const result = await getClient().send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
  );
  return result;
}

export async function deleteFile(key: string) {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key }),
  );
}

export async function listFiles(prefix?: string) {
  const result = await getClient().send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }),
  );
  return result.Contents || [];
}

export async function uploadAudioFile(
  meetingId: string,
  fileName: string,
  body: Buffer,
) {
  const key = `audio/${meetingId}/${Date.now()}-${fileName}`;
  return uploadFile(key, body, "audio/mpeg");
}

export async function uploadExportFile(
  meetingId: string,
  format: string,
  body: Buffer,
) {
  const key = `exports/${meetingId}/${format}/${Date.now()}.${format}`;
  return uploadFile(key, body);
}
