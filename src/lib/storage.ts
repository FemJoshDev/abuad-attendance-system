import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "node:fs/promises";
import path from "node:path";

export type StoredObject = {
  key: string;
  url: string;
};

export interface ObjectStorage {
  put(input: { key: string; body: Uint8Array; contentType: string }): Promise<StoredObject>;
  delete(key: string): Promise<void>;
}

function getProvider() {
  return process.env.STORAGE_PROVIDER ?? (process.env.NODE_ENV === "production" ? "s3" : "local");
}

function getRequiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required when STORAGE_PROVIDER=s3.`);
  return value;
}

class LocalObjectStorage implements ObjectStorage {
  private readonly directory = path.join(process.cwd(), "public", "uploads", "avatars");

  async put({ key, body }: { key: string; body: Uint8Array; contentType: string }): Promise<StoredObject> {
    const fileName = path.basename(key);
    await fs.mkdir(this.directory, { recursive: true });
    await fs.writeFile(path.join(this.directory, fileName), body);
    return { key, url: `/uploads/avatars/${fileName}` };
  }

  async delete(key: string): Promise<void> {
    await fs.unlink(path.join(this.directory, path.basename(key))).catch(() => undefined);
  }
}

class S3ObjectStorage implements ObjectStorage {
  private readonly bucket = getRequiredEnvironment("STORAGE_BUCKET");
  private readonly publicUrl = getRequiredEnvironment("STORAGE_PUBLIC_URL").replace(/\/$/, "");
  private readonly client = new S3Client({
    region: process.env.STORAGE_REGION ?? "auto",
    endpoint: process.env.STORAGE_ENDPOINT || undefined,
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: getRequiredEnvironment("STORAGE_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnvironment("STORAGE_SECRET_ACCESS_KEY"),
    },
  });

  async put({ key, body, contentType }: { key: string; body: Uint8Array; contentType: string }): Promise<StoredObject> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
    return { key, url: `${this.publicUrl}/${key}` };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

export function getObjectStorage(): ObjectStorage {
  const provider = getProvider();
  if (provider === "local") return new LocalObjectStorage();
  if (provider === "s3") return new S3ObjectStorage();
  throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
}
