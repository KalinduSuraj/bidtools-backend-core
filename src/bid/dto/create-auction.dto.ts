import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateAuctionDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  startTime: number; // unix ms

  @IsNotEmpty()
  @IsNumber()
  endTime: number; // unix ms

  @IsNotEmpty()
  @IsNumber()
  startingPrice: number;

  @IsOptional()
  @IsString()
  jobId?: string; // our local job_id to link auction to existing job

  @IsOptional()
  @IsObject()
  additionalDetails?: Record<string, any>;
}
