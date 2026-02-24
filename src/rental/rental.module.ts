import { Module } from '@nestjs/common';
import { RentalService } from './rental.service';
import { RentalController } from './rental.controller';
import { RentalRepository } from './rental.repository';
import { DynomodbModule } from '../common/dynomodb/dynomodb.module';

@Module({
  imports: [DynomodbModule],
  controllers: [RentalController],
  providers: [RentalService, RentalRepository],
})
export class RentalModule {}
