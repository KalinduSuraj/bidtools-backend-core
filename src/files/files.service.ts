import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream } from 'fs';

@Injectable()
export class FilesService {
  private s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
  private readonly logger = new Logger(FilesService.name);

  async uploadFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Support both memoryStorage (file.buffer) and diskStorage (file.path)
    const body: Buffer | NodeJS.ReadableStream | undefined =
      file.buffer ?? (file.path ? createReadStream(file.path) : undefined);

    if (!body) {
      throw new BadRequestException('File data not available');
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.originalname,
      Body: body,
      ContentType: file.mimetype,
    });

    try {
      await this.s3.send(command);
      return { key: file.originalname };
    } catch (error) {
      console.log(error); // ← IMPORTANT
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  async getFileUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(this.s3, command, { expiresIn: 3600 }); // 1 hour
  }
}
