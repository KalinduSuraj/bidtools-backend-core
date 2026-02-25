import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * HTTP client wrapping all calls to the standalone Bidding Microservice.
 * The bidding service runs on Firebase RTDB and exposes REST + SSE endpoints.
 */
@Injectable()
export class BiddingServiceClient {
  private readonly logger = new Logger(BiddingServiceClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly tenantId: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (
      this.config.get<string>('BIDDING_SERVICE_URL') || 'http://localhost:3000'
    ).replace(/\/$/, '');
    this.apiKey = this.config.get<string>('BIDDING_SERVICE_API_KEY') || '';
    this.tenantId =
      this.config.get<string>('OUR_TENANT_ID') || 'default-tenant';
  }

  /** Our tenant ID configured in env */
  getTenantId(): string {
    return this.tenantId;
  }

  /**
   * POST /api/v1/jobs — Create a job auction
   */
  async createAuction(params: {
    jobDetails: Record<string, any>;
    startTime: number;
    endTime: number;
    startingPrice: number;
  }): Promise<{ tenantId: string; jobId: string; data: any }> {
    const url = `${this.baseUrl}/api/v1/jobs`;

    this.logger.log(`Creating auction at ${url}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        tenantId: this.tenantId,
        jobDetails: params.jobDetails,
        startTime: params.startTime,
        endTime: params.endTime,
        startingPrice: params.startingPrice,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      this.logger.error(`Create auction failed: ${JSON.stringify(data)}`);
      throw new Error(
        data?.message || `Bidding service responded with ${res.status}`,
      );
    }

    this.logger.log(`Auction created: jobId=${data.jobId}`);
    return data;
  }

  /**
   * POST /api/v1/jobs/:tenantId/:jobId/bid — Place a bid (lower price wins)
   */
  async placeBid(params: {
    jobId: string;
    userId: string;
    amount: number;
  }): Promise<{ success: boolean; message: string; updatedJob: any }> {
    const url = `${this.baseUrl}/api/v1/jobs/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(params.jobId)}/bid`;

    this.logger.log(
      `Placing bid on job ${params.jobId}: user=${params.userId}, amount=${params.amount}`,
    );

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        userId: params.userId,
        amount: params.amount,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      this.logger.warn(`Place bid failed: ${JSON.stringify(data)}`);
      throw new Error(
        data?.message || `Bidding service responded with ${res.status}`,
      );
    }

    return data;
  }

  /**
   * Returns the SSE stream URL for a given jobId.
   * GET /api/v1/jobs/:tenantId/:jobId/stream
   */
  getStreamUrl(jobId: string): string {
    return `${this.baseUrl}/api/v1/jobs/${encodeURIComponent(this.tenantId)}/${encodeURIComponent(jobId)}/stream`;
  }
}
