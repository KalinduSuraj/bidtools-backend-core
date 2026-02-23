import { Module } from '@nestjs/common';
import { RentalService } from './rental.service';
import { RentalController } from './rental.controller';
import { RentalRepository } from './rental.repository';

@Module({
  controllers: [RentalController],
  providers: [RentalService, RentalRepository],
})
export class RentalModule {}
