import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Param,
  Res,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { BidProxyService } from './bid.proxy.service';
import { BidAuctionService } from './bid-auction.service';

@ApiTags('Bidding (API compatibility)')
@Controller('api/v1/jobs')
export class BidApiController {
  private readonly logger = new Logger(BidApiController.name);

  constructor(
    private readonly bidProxyService: BidProxyService,
    private readonly bidAuctionService: BidAuctionService,
  ) {}

  @ApiOperation({ summary: 'Create job / auction on external bidding service' })
  @Post()
  async createJob(@Req() req: Request, @Body() body: any) {
    // optional x-api-key forwarding
    const apiKey =
      typeof req.headers['x-api-key'] === 'string'
        ? req.headers['x-api-key']
        : undefined;
    return this.bidProxyService.createJob(body, apiKey);
  }

  @ApiOperation({
    summary: 'Place a bid for a job (external API compatibility)',
  })
  @Post(':jobId/bid')
  async placeBid(
    @Param('jobId') jobId: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    const apiKey =
      typeof req.headers['x-api-key'] === 'string'
        ? req.headers['x-api-key']
        : undefined;
    return this.bidProxyService.placeBidRemote(jobId, body, apiKey);
  }

  @ApiOperation({
    summary: 'SSE proxy — stream bids for a job (external API compatibility)',
  })
  @Get(':jobId/stream')
  async stream(
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

    this.logger.log(`Opening API-compatible SSE proxy to ${streamUrl}`);

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
}
