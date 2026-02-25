import { IsNotEmpty, IsString, IsNumber, IsISO8601 } from 'class-validator';

export class CreateRentalDto {
  @IsNotEmpty()
  @IsString()
  job_id: string;

  @IsNotEmpty()
  @IsString()
  contractor_id: string;

  @IsNotEmpty()
  @IsString()
  supplier_id: string;

  @IsNotEmpty()
  @IsString()
  bid_id: string;

  @IsNotEmpty()
  @IsISO8601()
  start_date: string;

  @IsNotEmpty()
  @IsISO8601()
  end_date: string;

  @IsNotEmpty()
  @IsNumber()
  total_amount: number;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  @IsString()
  payment_status: string;
}
