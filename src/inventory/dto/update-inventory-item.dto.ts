import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryItemDto } from './create-inventory-item.dto';
import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO for updating an existing inventory item
 * All fields are optional
 */
export class UpdateInventoryItemDto extends PartialType(
  CreateInventoryItemDto,
) {
  @IsString()
  @IsOptional()
  @IsIn([
    'AVAILABLE',
    'PARTIALLY_AVAILABLE',
    'UNAVAILABLE',
    'MAINTENANCE',
    'RETIRED',
  ])
  status?: string;

  @IsString()
  @IsOptional()
  last_maintenance_date?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  condition_rating?: number;
}
