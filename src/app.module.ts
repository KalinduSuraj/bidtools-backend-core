import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DynomodbModule } from './common/dynomodb/dynomodb.module';
import { TestDbModule } from './test-db/test-db.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DynomodbModule,
    TestDbModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
