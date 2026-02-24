import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsRepository } from './emails.repository';
import { DynomodbModule } from '../common/dynomodb/dynomodb.module';

@Module({
  imports: [DynomodbModule],
  providers: [EmailsService, EmailsRepository], // Register the service
  exports: [EmailsService], // <--- CRITICAL: Allows NotificationsModule to use it
})
export class EmailsModule {}
