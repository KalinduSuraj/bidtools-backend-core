import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentRepository } from './payment.repository';
import { DynomodbModule } from '../common/dynomodb/dynomodb.module';

@Module({
  imports:[DynomodbModule],
  controllers: [PaymentController],
  providers: [PaymentService,PaymentRepository],
})
export class PaymentModule {}
