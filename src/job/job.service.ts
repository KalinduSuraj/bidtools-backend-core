import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { Job } from './entities/job.entity';
import { JobRepository } from './job.repository';
import { v4 as uuid } from 'uuid';

@Injectable()
export class JobService {
  constructor(private readonly jobRepository: JobRepository) {}

  async createJob(contractorId: string, dto: CreateJobDto): Promise<Job> {
    const jobId = uuid();
    const now = new Date().toISOString();

    const job: Job = {
      job_id: jobId,
      contractor_id: contractorId,
      job_description: dto.job_description,
      required_from: dto.required_from,
      required_to: dto.required_to,
      latitude: dto.latitude,
      longitude: dto.longitude,
      status: 'OPEN',
      created_at: now,
    };

    await this.jobRepository.saveJob(job);
    return job;
  }

  async getJobsByContractor(contractorId: string): Promise<Job[]> {
    return this.jobRepository.getJobsByContractor(contractorId);
  }

  /**
   * Return jobs nearest to given coordinates (in kilometers). Uses simple Haversine distance.
   */
  async getNearestJobs(
    latitude: number,
    longitude: number,
    radiusKm?: number,
    limit = 50,
  ): Promise<(Job & { distance_km: number })[]> {
    const jobs = await this.jobRepository.getAllJobs();

    const radius = radiusKm ?? 50;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const haversine = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number,
    ) => {
      const R = 6371; // km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const withDistance = jobs
      .map((j) => {
        if (typeof j.latitude !== 'number' || typeof j.longitude !== 'number')
          return null;
        const dist = haversine(latitude, longitude, j.latitude, j.longitude);
        return { ...j, distance_km: dist } as Job & { distance_km: number };
      })
      .filter(
        (x): x is Job & { distance_km: number } =>
          x !== null && x.distance_km <= radius,
      )
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, limit);

    return withDistance;
  }

  async getJobById(jobId: string): Promise<Job> {
    const job = await this.jobRepository.getJobByIdOnly(jobId);
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    return job;
  }

  async cancelJob(contractorId: string, jobId: string): Promise<Job> {
    const job = await this.jobRepository.getJobByIdOnly(jobId);
    if (!job || job.contractor_id !== contractorId) {
      throw new NotFoundException('Job not found for contractor');
    }

    const updated: Job = {
      ...job,
      status: 'CANCELLED',
      updated_at: new Date().toISOString(),
    };

    await this.jobRepository.updateJob(updated);
    return updated;
  }

  /**
   * Update a job with auction results from the bidding service webhook.
   * Accepts partial fields to update.
   */
  async updateJobAuctionResult(
    jobId: string,
    result: Partial<
      Pick<
        Job,
        | 'status'
        | 'auction_job_id'
        | 'winning_bidder'
        | 'winning_amount'
        | 'total_bids_count'
        | 'auction_completed_at'
      >
    >,
  ): Promise<Job> {
    const job = await this.jobRepository.getJobByIdOnly(jobId);
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    const updated: Job = {
      ...job,
      ...result,
      updated_at: new Date().toISOString(),
    };

    await this.jobRepository.updateJob(updated);
    return updated;
  }
}
