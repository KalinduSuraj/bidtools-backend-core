import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailsModule } from 'src/emails/emails.module';
import { NotificationsRepository } from './notifications.repository';
@Module({
  imports:[EmailsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService,NotificationsRepository],
})
export class NotificationsModule {}
