import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentRepository } from './payment.repository';

@Injectable()
export class PaymentService {

  constructor(private readonly paymentRepository: PaymentRepository) {}

  placePayment(createPaymentDto: CreatePaymentDto) {
    return 'This action adds a new payment';
  }

  getAllPayments() {
    return this.paymentRepository.getAllPayments();
  }

  getPaymentById(id: number) {
    return `This action returns a #${id} payment`;
  }

  updatePaymentDetails(id: number, updatePaymentDto: UpdatePaymentDto) {
    return `This action updates a #${id} payment`;
  }

  deletePayment(id: number) {
    return `This action removes a #${id} payment`;
  }
}
