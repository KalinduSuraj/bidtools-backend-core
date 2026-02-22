import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DynomodbModule } from './common/dynomodb/dynomodb.module';
import { TestDbModule } from './test-db/test-db.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailsModule } from './emails/emails.module';
import { PaymentModule } from './payment/payment.module';
import { FilesModule } from './files/files.module';
import { ItemModule } from './item/item.module';
import { JobModule } from './job/job.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DynomodbModule,
    TestDbModule,
    EmailsModule,
    NotificationsModule,
    PaymentModule,
    FilesModule,
    ItemModule,
    JobModule,
    AuthModule,
    ProfilesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
