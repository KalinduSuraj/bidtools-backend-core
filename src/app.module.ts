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
import { InventoryModule } from './inventory/inventory.module';

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
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
