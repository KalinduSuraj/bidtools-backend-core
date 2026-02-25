import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsRepository } from './emails.repository';
import { DynomodbModule } from '../common/dynomodb/dynomodb.module';
import { EmailsController } from './emails.controller';

@Module({
  imports: [DynomodbModule],
  controllers: [EmailsController],
  providers: [EmailsService, EmailsRepository], // Register the service
  exports: [EmailsService], // <--- CRITICAL: Allows NotificationsModule to use it
})
export class EmailsModule {}
