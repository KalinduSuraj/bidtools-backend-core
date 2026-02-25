import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationController } from './notifications.controller';
import { EmailsModule } from 'src/emails/emails.module';
import { NotificationsRepository } from './notifications.repository';
import { DynomodbModule } from '../common/dynomodb/dynomodb.module';

@Module({
  imports: [EmailsModule, DynomodbModule],
  controllers: [NotificationController],
  providers: [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}
