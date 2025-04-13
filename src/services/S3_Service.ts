import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as dotenv from 'dotenv';
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  const bucket = process.env.S3_BUCKET_NAME!;
  const key = `post/${Date.now()}_${file.originalname}`;

  const uploadParams: PutObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // ACL: 'public-read',
  };

  // Dùng lib-storage Upload để hỗ trợ stream lớn nếu cần
  const upload = new Upload({
    client: s3,
    params: uploadParams,
  });

  await upload.done();

  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

export const uploadAvt = async (file: Express.Multer.File): Promise<string> => {
  const bucket = process.env.S3_BUCKET_NAME!;
  const key = `avt/${Date.now()}_${file.originalname}`;

  const uploadParams: PutObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // ACL: 'public-read',
  };

  // Dùng lib-storage Upload để hỗ trợ stream lớn nếu cần
  const upload = new Upload({
    client: s3,
    params: uploadParams,
  });

  await upload.done();

  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

export const deleteImage = async (url: string): Promise<void> => {
  const key = url.split('.amazonaws.com/')[1];
  if (!key) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    })
  );
};