import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsInt,
} from 'class-validator';

/**
 * DTO for checking availability of an inventory item
 */
export class CheckAvailabilityDto {
  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @IsDateString()
  @IsNotEmpty()
  end_date: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  quantity: number;
}
