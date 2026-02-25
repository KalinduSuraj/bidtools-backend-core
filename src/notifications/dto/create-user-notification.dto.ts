import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserNotificationDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
}
