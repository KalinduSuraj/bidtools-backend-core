import { Module } from '@nestjs/common';
import { BidController } from './bid.controller';
import { BidService } from './bid.proxy.service';

@Module({
  controllers: [BidController],
  providers: [BidService],
  exports: [BidService],
})
export class BidModule {}
