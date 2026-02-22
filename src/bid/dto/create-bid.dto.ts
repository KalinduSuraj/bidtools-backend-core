import {
  IsNotEmpty,
  IsNumber,
  IsArray,
  ArrayNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class BidItem {
  @IsNotEmpty()
  @IsString()
  item_id: string;

  @IsNumber()
  quantity?: number;
}

export class CreateBidDto {
  @IsNotEmpty()
  @IsString()
  job_id: string;

  @IsNotEmpty()
  @IsNumber()
  bid_value: number;

  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BidItem)
  items: BidItem[];
}
