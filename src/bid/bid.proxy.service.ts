import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateBidDto } from './dto/create-bid.dto';

@Injectable()
export class BidProxyService {
  private baseUrl = process.env.BID_SERVICE_BASE_URL;

  private getBaseUrl(): string {
    if (!this.baseUrl)
      throw new BadRequestException('BID_SERVICE_BASE_URL not configured');
    return this.baseUrl.replace(/\/$/, '');
  }

  async createBid(
    supplierId: string,
    dto: CreateBidDto,
    authHeader?: string,
  ): Promise<unknown> {
    const base = this.getBaseUrl();
    const url = `${base}/jobs/${encodeURIComponent(dto.job_id)}/bids`;

    const payload = {
      job_id: dto.job_id,
      supplier_id: supplierId,
      bid_value: dto.bid_value,
      items: dto.items,
    };

    try {
      const res = await global.fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data: unknown = await res.json();
      if (!res.ok) {
        throw new InternalServerErrorException(
          typeof data === 'object' && data !== null && 'message' in data
            ? (data as { message: string }).message
            : `Bid service responded with status ${res.status}`,
        );
      }

      return data;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to call bid service: ${(err as Error).message}`,
      );
    }
  }

  async getBidsForJob(jobId: string, authHeader?: string): Promise<unknown> {
    const base = this.getBaseUrl();
    const url = `${base}/jobs/${encodeURIComponent(jobId)}/bids`;

    try {
      const res = await (global as { fetch: typeof fetch }).fetch(url, {
        method: 'GET',
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      });

      const data: unknown = await res.json();
      if (!res.ok) {
        throw new InternalServerErrorException(
          typeof data === 'object' && data !== null && 'message' in data
            ? (data as { message: string }).message
            : `Bid service responded with status ${res.status}`,
        );
      }

      return data;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to call bid service: ${(err as Error).message}`,
      );
    }
  }

  async getBidDetails(
    jobId: string,
    bidId: string,
    authHeader?: string,
  ): Promise<unknown> {
    const base = this.getBaseUrl();
    const url = `${base}/jobs/${encodeURIComponent(jobId)}/bids/${encodeURIComponent(
      bidId,
    )}`;

    try {
      const res = await (global as { fetch: typeof fetch }).fetch(url, {
        method: 'GET',
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      });

      const data: unknown = await res.json();
      if (!res.ok) {
        throw new InternalServerErrorException(
          typeof data === 'object' && data !== null && 'message' in data
            ? (data as { message?: string }).message
            : `Bid service responded with status ${res.status}`,
        );
      }

      return data;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to call bid service: ${(err as Error).message}`,
      );
    }
  }

  async createJob(dto: any, apiKey?: string): Promise<unknown> {
    const base = this.getBaseUrl();
    const url = `${base}/api/v1/jobs`;

    try {
      if (typeof global.fetch !== 'function') {
        throw new InternalServerErrorException(
          'Fetch API not available in global scope',
        );
      }
      const res = await global.fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(apiKey ? { 'x-api-key': apiKey } : {}),
        },
        body: JSON.stringify(dto),
      });

      const data: unknown = await res.json();
      if (!res.ok) {
        throw new InternalServerErrorException(
          typeof data === 'object' && data !== null && 'message' in data
            ? (data as { message?: string }).message
            : `Bid service responded with status ${res.status}`,
        );
      }

      return data;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to call bid service: ${(err as Error).message}`,
      );
    }
  }

  async placeBidRemote(
    jobId: string,
    dto: any,
    apiKey?: string,
  ): Promise<unknown> {
    const base = this.getBaseUrl();
    const url = `${base}/api/v1/jobs/${encodeURIComponent(jobId)}/bid`;

    try {
      const res = await (global as { fetch: typeof fetch }).fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(apiKey ? { 'x-api-key': apiKey } : {}),
        },
        body: JSON.stringify(dto),
      });

      const data: unknown = await res.json();
      if (!res.ok) {
        throw new InternalServerErrorException(
          typeof data === 'object' && data !== null && 'message' in data
            ? (data as { message?: string }).message
            : `Bid service responded with status ${res.status}`,
        );
      }

      return data;
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to call bid service: ${(err as Error).message}`,
      );
    }
  }
}
