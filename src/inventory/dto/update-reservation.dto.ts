import { PartialType } from '@nestjs/mapped-types';
import { CreateReservationDto } from './create-reservation.dto';
import { IsString, IsOptional, IsIn } from 'class-validator';

/**
 * DTO for updating a reservation
 */
export class UpdateReservationDto extends PartialType(CreateReservationDto) {
  @IsString()
  @IsOptional()
  @IsIn(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
  status?: string;
}
