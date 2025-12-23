import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsIn,
} from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  rental_id: number;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  @IsIn(['CARD', 'CASH'])
  payment_method?: string;

  @IsString()
  @IsOptional()
  transaction_reference?: string;

  @IsString()
  @IsOptional()
  @IsIn(['LKR', 'USD'])
  currency?: string;
}
