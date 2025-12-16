import { IsString, IsNotEmpty, IsEmpty } from 'class-validator';

export class CreateNotificationDto {

  @IsString()
  @IsEmpty()
  id:string;

  @IsString()
  @IsNotEmpty()
  type:string;

  @IsString()
  @IsNotEmpty()
  message:string;

  @IsString()
  @IsNotEmpty()
  userId:string;
}