import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsISO8601,
} from 'class-validator';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  job_description: string;

  @IsNotEmpty()
  @IsISO8601()
  required_from: string;

  @IsNotEmpty()
  @IsISO8601()
  required_to: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
