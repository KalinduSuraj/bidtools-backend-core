import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsRepository } from './emails.repository';

@Module({
  providers: [EmailsService, EmailsRepository],      // Register the service
  exports: [EmailsService],        // <--- CRITICAL: Allows NotificationsModule to use it
})
export class EmailsModule {}