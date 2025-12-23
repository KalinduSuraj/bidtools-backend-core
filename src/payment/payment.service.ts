import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentRepository } from './payment.repository';
import { Payment } from './entities/payment.entity';
import { v4 as uuid } from 'uuid';
import { GatewayProvider } from './providers/gateway.provider';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly gatewayProvider: GatewayProvider,
  ) {}

  async placePayment(createPaymentDto: CreatePaymentDto) {
    const { rental_id, amount, payment_method, currency } = createPaymentDto;
    const paymentId = uuid();
    const orderId = paymentId;

    const newPayment: Payment = {
      payment_id: paymentId,
      rental_id: rental_id,
      amount: amount,
      currency: currency || 'LKR',
      status: 'PENDING',
      method: payment_method || 'PAYHERE',
      transaction_reference: orderId,
      created_at: new Date(),
      is_deleted: false,
    };

    await this.paymentRepository.savePayment(newPayment);
    const hash = this.gatewayProvider.generateHash(
      orderId,
      amount,
      currency || 'LKR',
    );

    // 5. Return Data for Frontend
    return {
      sandbox: true,
      merchant_id: process.env.PAYHERE_MERCHANT_ID,
      return_url: process.env.PAYHERE_RETURN_URL,
      cancel_url: process.env.PAYHERE_CANCEL_URL,
      notify_url: process.env.PAYHERE_NOTIFY_URL,
      order_id: orderId,
      items: `Rental Payment #${rental_id}`,
      amount: amount.toFixed(2),
      currency: currency || 'LKR',
      hash: hash,
      // first_name: 'Saman',
      // last_name: 'Perera',
      // email: 'samanp@gmail.com',
      // phone: '0771234567',
      // address: 'No.1, Galle Road',
      // city: 'Colombo',
      // country: 'Sri Lanka',
    };
  }

  getAllPayments(): Promise<Payment[]> {
    return this.paymentRepository.getAllPayments();
  }

  async getPaymentById(id: string): Promise<Payment> {
    const paymentDetails = await this.paymentRepository.getPaymentById(id);
    if (!paymentDetails) {
      throw new NotFoundException(`Payment with ID "${id}" not found`);
    }
    return paymentDetails;
  }

  async updatePaymentDetails(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.getPaymentById(id);

    const updatedPayment = {
      ...payment,
      ...updatePaymentDto,
    };

    await this.paymentRepository.updatePaymentDetails(updatedPayment);
    return updatedPayment;
  }

  async processNotification(data: any) {

    // 1. Validate the Signature
    const isValid = this.gatewayProvider.validatePayment(data);
    if (!isValid) {
      console.error('Invalid PayHere Signature');
      throw new BadRequestException('Invalid Signature');
    }

    const paymentId = data.order_id;
    const statusCode = data.status_code;

    let status: 'SUCCESS' | 'FAILED' = 'FAILED';
    if (statusCode == '2') {
      status = 'SUCCESS';
    }
    const payment = await this.paymentRepository.getPaymentById(paymentId);

    if (!payment) {
      console.error(`Payment not found for ID: ${paymentId}`);
      return;
    }

    payment.status = status;
    await this.paymentRepository.updatePaymentDetails(payment);
    console.log(`Payment ${paymentId} updated to ${status}`);
  }

  deletePayment(id: string) {
    return this.paymentRepository.deletePayment(id);
  }
}
