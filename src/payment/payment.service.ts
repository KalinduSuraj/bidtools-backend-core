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
    console.log(`hash => ${hash}`);
    const payhereUrl = 'https://sandbox.payhere.lk/pay/checkout';

    const redirectHtml = `
      <html>
      <head>
        <title>Redirecting to PayHere...</title>
      </head>
      <body onload="document.forms[0].submit()">
        <p>Redirecting to Payment Gateway...</p>
        <form method="post" action="${payhereUrl}">
          <input type="hidden" name="merchant_id" value="${process.env.PAYHERE_MERCHANT_ID}">
          <input type="hidden" name="return_url" value="${process.env.PAYHERE_RETURN_URL}">
          <input type="hidden" name="cancel_url" value="${process.env.PAYHERE_CANCEL_URL}">
          <input type="hidden" name="notify_url" value="${process.env.PAYHERE_NOTIFY_URL}">
          <input type="hidden" name="order_id" value="${orderId}">
          <input type="hidden" name="items" value="Rental Payment #${rental_id}">
          <input type="hidden" name="currency" value="${currency || 'LKR'}">
          <input type="hidden" name="amount" value="${amount.toFixed(2)}">
          <input type="hidden" name="first_name" value="Saman">
          <input type="hidden" name="last_name" value="Perera">
          <input type="hidden" name="email" value="samanp@gmail.com">
          <input type="hidden" name="phone" value="0771234567">
          <input type="hidden" name="address" value="No.1, Galle Road">
          <input type="hidden" name="city" value="Colombo">
          <input type="hidden" name="country" value="Sri Lanka">
          <input type="hidden" name="hash" value="${hash}">
        </form>
      </body>
      </html>
    `;

    return redirectHtml;
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
    console.log(`[Notify] Processing Order ID: ${data.order_id}`);

    const isValid = this.gatewayProvider.validatePayment(data);

    if (!isValid) {
      console.error('[Notify] ❌ Invalid Signature. Payment Rejected.');
      throw new BadRequestException('Invalid Signature');
    }

    const paymentId = data.order_id;
    const statusCode = data.status_code;

    const payment = await this.paymentRepository.getPaymentById(paymentId);
    if (!payment) {
      console.error(`[Notify] ❌ Payment ID ${paymentId} not found in DB`);
      return;
    }

    if (statusCode == '2') {
      payment.status = 'SUCCESS';
      console.log(`[Notify] ✅ Payment SUCCESS for ${paymentId}`);
    } else {
      payment.status = 'FAILED';
      console.log(`[Notify] ⚠️ Payment FAILED or PENDING for ${paymentId}`);
    }

    await this.paymentRepository.updatePaymentDetails(payment);
  }

  deletePayment(id: string) {
    return this.paymentRepository.deletePayment(id);
  }
}
