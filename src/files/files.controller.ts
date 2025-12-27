import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FilesService {
  private s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  async uploadFile(file: Express.Multer.File) {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3.send(command);
    return { key: file.originalname };
  }

  async getFileUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(this.s3, command, { expiresIn: 3600 }); // 1 hour
  }
}
