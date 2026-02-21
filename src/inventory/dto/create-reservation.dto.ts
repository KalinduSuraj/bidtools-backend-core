import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsInt,
} from 'class-validator';

/**
 * DTO for creating a reservation (booking equipment)
 */
export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  inventory_id: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsOptional()
  rental_id?: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  quantity: number;

  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @IsDateString()
  @IsNotEmpty()
  end_date: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
