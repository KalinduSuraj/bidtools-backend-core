import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailsModule } from 'src/emails/emails.module';
import { NotificationsRepository } from './notifications.repository';
import { DynomodbModule } from '../common/dynomodb/dynomodb.module';
@Module({
  imports: [EmailsModule, DynomodbModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}
