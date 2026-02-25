import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  UnauthorizedException,
  Logger,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request, Response } from 'express';
import { CreateBidDto } from './dto/create-bid.dto';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
import type { WebhookPayload } from './dto/webhook-payload.dto';
import { BidProxyService } from './bid.proxy.service';
import { BidAuctionService } from './bid-auction.service';

@ApiTags('Bidding')
@Controller('bid')
export class BidController {
  private readonly logger = new Logger(BidController.name);

  constructor(
    private readonly bidProxyService: BidProxyService,
    private readonly bidAuctionService: BidAuctionService,
  ) {}

  // ──────────────────────────────────────────────
  // Bidding Microservice Integration Endpoints
  // ──────────────────────────────────────────────

  /**
   * POST /bid/auction — Create a new auction on the Bidding Microservice
   */
  @ApiOperation({ summary: 'Create a new auction on the Bidding Microservice' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('auction')
  async createAuction(
    @Req() req: Request & { user?: { userId?: string } },
    @Body() dto: CreateAuctionDto,
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('Missing user identity');

    return this.bidAuctionService.createAuction(userId, dto);
  }

  /**
   * POST /bid/place — Place a bid via the Bidding Microservice
   */
  @ApiOperation({
    summary: 'Place a bid via the Bidding Microservice (lower price wins)',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('place')
  async placeBid(
    @Req() req: Request & { user?: { userId?: string } },
    @Body() dto: PlaceBidDto,
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('Missing user identity');

    return this.bidAuctionService.placeBid(userId, dto);
  }

  /**
   * GET /bid/stream/:jobId — SSE proxy that connects to the Bidding Microservice's
   * SSE stream and pipes real-time bid updates to our frontend.
   */
  @ApiOperation({
    summary: 'SSE stream — real-time bid updates for an auction',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Auction job ID from the bidding service',
  })
  @Get('stream/:jobId')
  async streamBids(
    @Param('jobId') jobId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const streamUrl = this.bidAuctionService.getStreamUrl(jobId);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    this.logger.log(`Opening SSE proxy to ${streamUrl}`);

    try {
      const upstream = await fetch(streamUrl);

      if (!upstream.ok || !upstream.body) {
        res.write(
          `data: ${JSON.stringify({ error: 'Failed to connect to bidding service stream' })}\n\n`,
        );
        res.end();
        return;
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();

      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
          }
        } catch (err) {
          this.logger.warn(`SSE stream interrupted: ${(err as Error).message}`);
        } finally {
          res.end();
        }
      };

      // Clean up when client disconnects
      req.on('close', () => {
        this.logger.log(`Client disconnected from SSE stream for job ${jobId}`);
        reader.cancel().catch(() => {});
      });

      pump();
    } catch (err) {
      this.logger.error(`SSE proxy error: ${(err as Error).message}`);
      res.write(
        `data: ${JSON.stringify({ error: 'Stream connection failed' })}\n\n`,
      );
      res.end();
    }
  }

  /**
   * POST /bid/webhook/:tenantId — Receive JOB_AUCTION_COMPLETED webhook
   * from the Bidding Microservice. No JWT guard — validated by event payload.
   */
  @ApiOperation({
    summary: 'Webhook receiver for JOB_AUCTION_COMPLETED events',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant identifier' })
  @Post('webhook/:tenantId')
  async handleWebhook(
    @Param('tenantId') tenantId: string,
    @Body() payload: any,
  ) {
    const webhookData = payload as WebhookPayload;
    this.logger.log(`Webhook received for tenant ${tenantId}`);
    return this.bidAuctionService.handleWebhook(tenantId, webhookData);
  }

  // ──────────────────────────────────────────────
  // Legacy proxy endpoints (backward compatibility)
  // ──────────────────────────────────────────────

  /**
   * POST /bid — Create a bid (old proxy-style)
   */
  @ApiOperation({ summary: '[Legacy] Create a bid (old proxy-style)' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: Request & { user?: { userId?: string } },
    @Body() dto: CreateBidDto,
  ): Promise<unknown> {
    const supplierId = req.user?.userId;
    if (!supplierId)
      throw new UnauthorizedException('Missing supplier identity');
    const authHeader =
      typeof req.headers.authorization === 'string'
        ? req.headers.authorization
        : undefined;

    return this.bidProxyService.createBid(supplierId, dto, authHeader);
  }

  /**
   * GET /bid/:jobId — Get all bids for a job (old proxy-style)
   */
  @ApiOperation({ summary: '[Legacy] Get all bids for a job' })
  @Get(':jobId')
  async getForJob(
    @Param('jobId') jobId: string,
    @Req() req: Request,
  ): Promise<unknown> {
    const authHeader =
      typeof req.headers.authorization === 'string'
        ? req.headers.authorization
        : undefined;

    return this.bidProxyService.getBidsForJob(jobId, authHeader);
  }

  /**
   * GET /bid/:jobId/:bidId — Get a specific bid's details (old proxy-style)
   */
  @ApiOperation({ summary: "[Legacy] Get a specific bid's details" })
  @Get(':jobId/:bidId')
  async getBidDetails(
    @Param('jobId') jobId: string,
    @Param('bidId') bidId: string,
    @Req() req: Request,
  ): Promise<unknown> {
    const authHeader =
      typeof req.headers.authorization === 'string'
        ? req.headers.authorization
        : undefined;

    return this.bidProxyService.getBidDetails(jobId, bidId, authHeader);
  }
}
