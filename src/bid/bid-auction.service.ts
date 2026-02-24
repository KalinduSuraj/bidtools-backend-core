import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BiddingServiceClient } from './bidding-service.client';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
import { WebhookPayload } from './dto/webhook-payload.dto';
import { JobService } from '../job/job.service';

/**
 * Orchestrates the auction lifecycle by delegating to the
 * BiddingServiceClient and updating local DB via JobService.
 */
@Injectable()
export class BidAuctionService {
  private readonly logger = new Logger(BidAuctionService.name);

  constructor(
    private readonly biddingClient: BiddingServiceClient,
    private readonly jobService: JobService,
  ) {}

  /**
   * Create a new auction on the external Bidding Microservice.
   * If a local jobId is provided, links the auction to the existing job.
   */
  async createAuction(userId: string, dto: CreateAuctionDto) {
    try {
      const jobDetails: Record<string, any> = {
        title: dto.title,
        description: dto.description,
        createdBy: userId,
        ...dto.additionalDetails,
      };

      // If linking to an existing local job, include the local job_id
      if (dto.jobId) {
        jobDetails.localJobId = dto.jobId;
      }

      const result = await this.biddingClient.createAuction({
        jobDetails,
        startTime: dto.startTime,
        endTime: dto.endTime,
        startingPrice: dto.startingPrice,
      });

      // If we have a local job, update it with the auction jobId
      if (dto.jobId) {
        try {
          await this.jobService.updateJobAuctionResult(dto.jobId, {
            auction_job_id: result.jobId,
            status: 'BIDDING',
          });
        } catch (err) {
          this.logger.warn(
            `Failed to update local job ${dto.jobId} with auction link: ${(err as Error).message}`,
          );
        }
      }

      return {
        success: true,
        tenantId: result.tenantId,
        auctionJobId: result.jobId,
        data: result.data,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to create auction: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Place a bid via the external Bidding Microservice.
   */
  async placeBid(userId: string, dto: PlaceBidDto) {
    try {
      const result = await this.biddingClient.placeBid({
        jobId: dto.jobId,
        userId,
        amount: dto.amount,
      });

      return result;
    } catch (err) {
      throw new BadRequestException(
        `Failed to place bid: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Handle the JOB_AUCTION_COMPLETED webhook from the Bidding Microservice.
   * Updates the local job record with auction results.
   */
  async handleWebhook(tenantId: string, payload: WebhookPayload) {
    this.logger.log(
      `Webhook received: event=${payload.event}, jobId=${payload.jobId}, tenant=${tenantId}`,
    );

    if (payload.event !== 'JOB_AUCTION_COMPLETED') {
      this.logger.warn(`Unknown webhook event: ${payload.event}`);
      return { acknowledged: true, processed: false };
    }

    // Find the local job linked to this auction
    // The jobDetails from the bidding service should contain our localJobId
    const localJobId = payload.jobDetails?.localJobId;

    if (localJobId) {
      try {
        await this.jobService.updateJobAuctionResult(localJobId, {
          status: 'AWARDED',
          winning_bidder: payload.winningBidder,
          winning_amount: payload.winningAmount,
          total_bids_count: payload.totalBidsCount,
          auction_completed_at: new Date(payload.completedAt).toISOString(),
          auction_job_id: payload.jobId,
        });

        this.logger.log(
          `Job ${localJobId} updated with auction result: winner=${payload.winningBidder}, amount=${payload.winningAmount}`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to update job ${localJobId}: ${(err as Error).message}`,
        );
      }
    } else {
      this.logger.warn(
        `Webhook for auction ${payload.jobId} has no linked local job`,
      );
    }

    return {
      acknowledged: true,
      processed: true,
      auctionJobId: payload.jobId,
      localJobId: localJobId || null,
    };
  }

  /**
   * Get the SSE stream URL for a given auction job.
   */
  getStreamUrl(jobId: string): string {
    return this.biddingClient.getStreamUrl(jobId);
  }
}
