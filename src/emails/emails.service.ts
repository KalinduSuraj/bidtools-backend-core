import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateEmailDto } from './dto/create-email.dto';
import { Email } from './entities/email.entity';
import {
  SESClient,
  SendEmailCommand,
  VerifyEmailIdentityCommand,
} from '@aws-sdk/client-ses';
import { EmailsRepository } from './emails.repository';

@Injectable()
export class EmailsService {
  private sesClient: SESClient;

  constructor(private readonly emailsRepository: EmailsRepository) {
    const isLocal = process.env.NODE_ENV !== 'production';
    const config: any = {
      region: 'us-east-1',
    };

    if (isLocal) {
      config.endpoint = 'http://127.0.0.1:3001';
      config.credentials = {
        //! remove this
        accessKeyId: 'fake',
        secretAccessKey: 'fake',
      };
    }
    this.sesClient = new SESClient(config);
  }

  async OnModuleInit() {}

  async createEmail(createEmailDto: CreateEmailDto): Promise<Email> {
    if (process.env.NODE_ENV !== 'production') {
      try {
        await this.sesClient.send(
          new VerifyEmailIdentityCommand({ EmailAddress: createEmailDto.from }),
        );
      } catch (e) {
        console.error('Error in verifying email identity', e);
        throw e;
      }
    }

    const command = new SendEmailCommand({
      Source: createEmailDto.from,
      Destination: {
        ToAddresses: [createEmailDto.to],
      },
      Message: {
        Subject: { Data: createEmailDto.subject, Charset: 'UTF-8' },
        Body: {
          Text: { Data: createEmailDto.body, Charset: 'UTF-8' },
        },
      },
    });

    try {
      const res = await this.sesClient.send(command);
      console.log(`Email sent! Message ID: ${res.MessageId}`);

      const newEmail: Email = {
        ...createEmailDto,
        massageId: res.MessageId,
      };

      await this.emailsRepository.saveEmailLog(newEmail);
      return newEmail;
    } catch (err) {
      console.error('Error in ending Emails via SES', err);
      throw err;
    }
  }
}
