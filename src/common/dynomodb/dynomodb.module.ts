import { Module } from '@nestjs/common';
import { DynomodbService } from './dynomodb.service';

@Module({
  providers: [DynomodbService],
  exports: [DynomodbService],
})
export class DynomodbModule {}
