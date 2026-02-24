import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class PlaceBidDto {
    @IsNotEmpty()
    @IsString()
    jobId: string; // auction jobId from the bidding service

    @IsNotEmpty()
    @IsNumber()
    amount: number;
}
