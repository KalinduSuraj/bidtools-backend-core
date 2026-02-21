import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsIn,
  IsArray,
  IsObject,
  IsInt,
  IsPositive,
} from 'class-validator';

/**
 * DTO for creating a new inventory item
 */
export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([
    'EXCAVATOR',
    'CRANE',
    'LOADER',
    'BULLDOZER',
    'FORKLIFT',
    'COMPACTOR',
    'GENERATOR',
    'SCAFFOLDING',
    'CONCRETE_MIXER',
    'DUMP_TRUCK',
    'OTHER',
  ])
  category: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  serial_number: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  total_quantity: number;

  @IsNumber()
  @IsPositive()
  daily_rate: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  hourly_rate?: number;

  @IsString()
  @IsOptional()
  @IsIn(['LKR', 'USD', 'EUR'])
  currency?: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  supplier_id?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  condition_rating?: number;

  @IsString()
  @IsOptional()
  next_maintenance_date?: string;

  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  min_rental_duration?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  max_rental_duration?: number;
}
