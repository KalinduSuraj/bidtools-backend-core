import { Injectable, BadRequestException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private s3: S3Client;

  constructor() {
    const isLocal = process.env.NODE_ENV !== 'production';
    const config: S3ClientConfig = {
      region: process.env.AWS_REGION || 'us-east-1',
    };

    if (!isLocal) {
      if (
        !process.env.AWS_ACCESS_KEY_ID ||
        !process.env.AWS_SECRET_ACCESS_KEY
      ) {
        throw new Error(
          'AWS credentials are required in production environment',
        );
      }
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    } else {
      // For local development, use fake credentials
      config.credentials = {
        accessKeyId: 'fake',
        secretAccessKey: 'fake',
      };
    }

    this.s3 = new S3Client(config);
  }

  private sanitizeFilename(filename: string): string {
    // Remove any path traversal attempts and invalid characters
    return filename
      .replace(/\.\./g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 255); // Limit filename length
  }

  private generateUniqueKey(originalFilename: string): string {
    const sanitizedFilename = this.sanitizeFilename(originalFilename);
    const uuid = uuidv4();
    const timestamp = Date.now();
    const extension = sanitizedFilename.split('.').pop() || '';
    const nameWithoutExt = sanitizedFilename.replace(`.${extension}`, '');

    return `${timestamp}-${uuid}-${nameWithoutExt}.${extension}`;
  }

  async uploadFile(file: Express.Multer.File) {
    try {
      const uniqueKey = this.generateUniqueKey(file.originalname);

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: uniqueKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3.send(command);
      return { key: uniqueKey };
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new BadRequestException('Failed to upload file to S3');
    }
  }

  async getFileUrl(key: string): Promise<{ url: string }> {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      });

      const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 }); // 1 hour
      return { url };
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new BadRequestException('Failed to generate file URL');
    }
  }
}
