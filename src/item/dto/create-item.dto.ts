import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  supplier_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price_per_day: number;

  @IsNumber()
  @Min(0)
  price_per_hour: number;

  @IsEnum(['available', 'rented', 'maintenance', 'inactive'])
  @IsOptional()
  status?: 'available' | 'rented' | 'maintenance' | 'inactive';

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
