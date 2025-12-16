import { IsString, IsNotEmpty, IsEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateNotificationDto {

  @IsString()
  @IsEmpty()
  notification_id:string;

  @IsString()
  @IsEmpty()
  user_id:string;


  @IsString()
  @IsNotEmpty()
  type:string;

  @IsString()
  @IsNotEmpty()
  content:string;

  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
}