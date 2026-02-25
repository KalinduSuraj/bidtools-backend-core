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
    // region must match the bucket region in production
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  private readonly logger = new Logger(FilesService.name);

  async uploadFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Prefer memory buffer (production uses memoryStorage). Fallback to disk if needed.
    const body: Buffer | NodeJS.ReadableStream | undefined =
      file.buffer ?? (file.path ? createReadStream(file.path) : undefined);

    if (!body) {
      throw new BadRequestException('File data not available');
    }

    // Avoid filename collisions by prefixing with timestamp
    const key = `${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: file.mimetype,
    });

    try {
      await this.s3.send(command);
      return { key };
    } catch (error: any) {
      // Log full error details (including AWS SDK metadata) to help debugging
      try {
        const meta =
          error && typeof error === 'object' && '$metadata' in error
            ? JSON.stringify((error as { $metadata: unknown }).$metadata)
            : undefined;
        const msg: string =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message: unknown }).message)
            : String(error);
        this.logger.error(`S3 upload failed: ${msg}`);
        if (meta) this.logger.debug(`S3 error metadata: ${meta}`);
      } catch {
        // best-effort logging
        // swallow
      }

      // In development return the underlying message to aid debugging. In production
      // consider returning a generic message and inspecting logs instead.
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'unknown error';
      throw new InternalServerErrorException(
        `Failed to upload file to S3: ${errorMessage}`,
      );
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
