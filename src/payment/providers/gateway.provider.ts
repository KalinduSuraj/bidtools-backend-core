import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class GatewayProvider {
  private merchantId = process.env.PAYHERE_MERCHANT_ID!.trim();
  private merchantSecret = process.env.PAYHERE_SECRET!.trim();

  generateHash(
    orderId: string,
    amount: number,
    currency: string = 'LKR',
  ): string {
    const amountFormatted = amount.toFixed(2);
    const hashedSecret = crypto
      .createHash('md5')
      .update(this.merchantSecret)
      .digest('hex')
      .toUpperCase();

    const hashString = `${this.merchantId}${orderId}${amountFormatted}${currency}${hashedSecret}`;

    return crypto
      .createHash('md5')
      .update(hashString)
      .digest('hex')
      .toUpperCase();
  }

  validatePayment(data: any): boolean {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
    } = data;

    const hashedSecret = crypto
      .createHash('md5')
      .update(this.merchantSecret)
      .digest('hex')
      .toUpperCase();

    const hashString = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${hashedSecret}`;
    const localHash = crypto
      .createHash('md5')
      .update(hashString)
      .digest('hex')
      .toUpperCase();

    console.log('--- 🛑 PAYHERE VALIDATION DEBUG 🛑 ---');
    console.log('Order ID:', order_id);
    console.log('Amount:', payhere_amount);
    console.log('Status:', status_code);
    console.log('Received Hash (Remote):', md5sig);
    console.log('Expected Hash (Local): ', localHash);
    console.log('--------------------------------------');

    if (!md5sig) return false;

    const bufferLocal = Buffer.from(localHash);
    const bufferRemote = Buffer.from(md5sig);
    return (
      bufferLocal.length === bufferRemote.length &&
      crypto.timingSafeEqual(bufferLocal, bufferRemote) &&
      status_code == '2'
    );
  }
}
