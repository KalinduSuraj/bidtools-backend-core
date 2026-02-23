import { Injectable } from '@nestjs/common';
import { DynomodbService } from '../common/dynomodb/dynomodb.service';
import { Rental } from './entities/rental.entity';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class RentalRepository {
  private tableName = process.env.DYNAMODB_TABLE!;
  private gsi3IndexName = process.env.DYNAMODB_GSI3_INDEX || 'GSI3';
  private gsi4IndexName = process.env.DYNAMODB_GSI4_INDEX || 'GSI4';

  constructor(private readonly db: DynomodbService) {}

  async saveRental(rental: Rental): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: rental,
    });
    await this.db.client.send(command);
  }

  async getRentalById(rentalId: string): Promise<Rental | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `RENTAL#${rentalId}`,
        ':sk': 'METADATA',
      },
    });
    const result = await this.db.client.send(command);
    return (result.Items?.[0] as Rental) || null;
  }

  async getRentalsByContractor(contractorId: string): Promise<Rental[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: this.gsi3IndexName,
      KeyConditionExpression: 'GSI3PK = :pk AND begins_with(GSI3SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `CONTRACTOR#${contractorId}`,
        ':sk': 'RENTAL#',
      },
    });
    const result = await this.db.client.send(command);
    return (result.Items as Rental[]) || [];
  }

  async getRentalsBySupplier(supplierId: string): Promise<Rental[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: this.gsi4IndexName,
      KeyConditionExpression: 'GSI4PK = :pk AND begins_with(GSI4SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `SUPPLIER#${supplierId}`,
        ':sk': 'RENTAL#',
      },
    });
    const result = await this.db.client.send(command);
    return (result.Items as Rental[]) || [];
  }
}
