import { Injectable } from '@nestjs/common';
import { CreateEmailDto } from './dto/create-email.dto';
import { Email } from './entities/email.entity';
import { Resend } from 'resend';
import { EmailsRepository } from './emails.repository';

@Injectable()
export class EmailsService {
  private resendClient: Resend;

  constructor(private readonly emailsRepository: EmailsRepository) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY not set - emails will fail in production');
    }
    this.resendClient = new Resend(apiKey as string);
  }

  async createEmail(createEmailDto: CreateEmailDto): Promise<Email> {
    try {
      const resp = (await this.resendClient.emails.send({
        from: createEmailDto.from,
        to: createEmailDto.to,
        subject: createEmailDto.subject,
        // Resend accepts html; include text fallback in body if needed
        text: createEmailDto.body,
      })) as { id?: string };

      const messageId = resp.id;
      console.log(`Email sent via Resend! Message ID: ${messageId}`);

      const newEmail: Email = {
        ...createEmailDto,
        massageId: messageId ?? undefined,
      };

      await this.emailsRepository.saveEmailLog(newEmail);
      return newEmail;
    } catch (err) {
      console.error('Error sending Email via Resend', err);
      throw err;
    }
  }
}
