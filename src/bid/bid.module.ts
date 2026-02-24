import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BidController } from './bid.controller';
import { BidProxyService } from './bid.proxy.service';
import { BidAuctionService } from './bid-auction.service';
import { BiddingServiceClient } from './bidding-service.client';
import { JobModule } from '../job/job.module';

@Module({
  imports: [ConfigModule, JobModule],
  controllers: [BidController],
  providers: [BidProxyService, BidAuctionService, BiddingServiceClient],
  exports: [BidProxyService, BidAuctionService, BiddingServiceClient],
})
export class BidModule { }
