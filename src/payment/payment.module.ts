import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentRepository } from './payment.repository';
import { DynomodbModule } from '../common/dynomodb/dynomodb.module';
import { GatewayProvider } from './providers/gateway.provider';

@Module({
  imports: [DynomodbModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository, GatewayProvider],
})
export class PaymentModule {}
