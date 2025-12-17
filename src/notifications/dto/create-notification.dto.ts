import {
  IsString,
  IsNotEmpty,
  IsEmpty,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  targetEmail: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
}
