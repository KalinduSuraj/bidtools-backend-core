import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
  Param,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { Job } from './entities/job.entity';

@ApiTags('Jobs')
@ApiBearerAuth('JWT-auth')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  /**
   * Create a job (contractor from JWT)
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: Request & { user?: { userId?: string } },
    @Body() dto: CreateJobDto,
  ): Promise<Job> {
    const contractorId = req.user?.userId;
    if (!contractorId) {
      throw new UnauthorizedException('Missing contractor identity');
    }

    return this.jobService.createJob(contractorId, dto);
  }

  /**
   * Get jobs for contractor
   */
  @UseGuards(JwtAuthGuard)
  @Get('contractor')
  async findMyJobs(
    @Req() req: Request & { user?: { userId?: string } },
  ): Promise<Job[]> {
    const contractorId = req.user?.userId;
    if (!contractorId)
      throw new UnauthorizedException('Missing contractor identity');
    return this.jobService.getJobsByContractor(contractorId);
  }

  /**
   * Get job by jobId (GSI2)
   */
  // Removed single job public endpoint - not required in simplified API

  /**
   * Get details for a specific job (by jobId) - uses GSI2
   */
  @Get(':jobId')
  async findOne(@Param('jobId') jobId: string): Promise<Job> {
    return this.jobService.getJobById(jobId);
  }

  /**
   * Get nearest jobs for supplier view
   * Query params: latitude, longitude, radiusKm (optional)
   */
  @Get('nearby')
  async findNearest(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (!isFinite(lat) || !isFinite(lon)) {
      throw new BadRequestException(
        'Query parameters latitude and longitude are required and must be numbers',
      );
    }

    const radius = radiusKm !== undefined ? Number(radiusKm) : 50;
    if (radiusKm !== undefined && !isFinite(radius)) {
      throw new BadRequestException(
        'Query parameter radiusKm must be a number',
      );
    }

    return this.jobService.getNearestJobs(lat, lon, radius ?? 50);
  }
}
