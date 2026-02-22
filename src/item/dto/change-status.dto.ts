import { IsEnum, IsNotEmpty } from 'class-validator';

/**
 * DTO for changing item availability status
 */
export class ChangeStatusDto {
  @IsEnum(['available', 'rented', 'maintenance', 'inactive'])
  @IsNotEmpty()
  status: 'available' | 'rented' | 'maintenance' | 'inactive';
}
