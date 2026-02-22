import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';
import { CreateBidDto } from './dto/create-bid.dto';
import { BidService } from './bid.proxy.service';

@Controller('bid')
export class BidController {
  constructor(private readonly bidService: BidService) {}

  /**
   * Create a bid for a job. Supplier identity is taken from JWT (req.user.userId).
   */
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

    return this.bidService.createBid(supplierId, dto, authHeader);
  }

  /**
   * Get all bids for a job. Accessible by both contractor and supplier (no role check).
   */
  @Get(':jobId')
  async getForJob(
    @Param('jobId') jobId: string,
    @Req() req: Request,
  ): Promise<unknown> {
    const authHeader =
      typeof req.headers.authorization === 'string'
        ? req.headers.authorization
        : undefined;

    return this.bidService.getBidsForJob(jobId, authHeader);
  }
}
