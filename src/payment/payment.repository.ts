import { Injectable } from '@nestjs/common';
import { DynomodbService } from '../common/dynomodb/dynomodb.service';
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Payment } from '../payment/entities/payment.entity';
@Injectable()
export class PaymentRepository {
  private tableName = process.env.DYNAMODB_TABLE!;

  constructor(private readonly db: DynomodbService) {}

  async getAllPayments() {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      FilterExpression: 'is_deleted = :is_deleted',
      ExpressionAttributeValues: {
        ':pk': 'PAYMENT',
        ':is_deleted': false,
      },
      ScanIndexForward: false,
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as Payment[];
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: 'PAYMENT',
        SK: `ITEM#${paymentId}`,
      },
    });

    const result = await this.db.client.send(command);
    const item = result.Item as Payment;

    if (!item || item.is_deleted) {
      return null;
    }

    return item;
  }

  async updatePaymentDetails(payment: Payment) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: 'PAYMENT',
        SK: `ITEM#${payment.payment_id}`,
        ...payment,
        updatedAt: new Date().toISOString(),
      },
    });
    await this.db.client.send(command);
  }

  async deletePayment(paymentId: string) {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: 'PAYMENT',
        SK: `ITEM#${paymentId}`,
      },
      UpdateExpression: 'set is_deleted = :is_deleted',
      ExpressionAttributeValues: {
        ':is_deleted': true,
      },
    });
    await this.db.client.send(command);
  }

  async savePayment(newPayment: Payment) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: 'PAYMENT',
        SK: `ITEM#${newPayment.payment_id}`,
        ...newPayment,
        created_at: newPayment.created_at.toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    await this.db.client.send(command);
  }
}
