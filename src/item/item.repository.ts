import { Injectable } from '@nestjs/common';
import { DynomodbService } from '../common/dynomodb/dynomodb.service';
import { Item } from './entities/item.entity';
import {
  PutCommand,
  QueryCommand,
  GetCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class ItemRepository {
  private tableName = process.env.DYNAMODB_TABLE!;

  constructor(private readonly db: DynomodbService) {}

  async saveItem(item: Item): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `SUPPLIER#${item.supplier_id}`,
        SK: `ITEM#${item.item_id}`,
        ...item,
      },
    });

    await this.db.client.send(command);
  }

  async getItemsBySupplier(supplierId: string): Promise<Item[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `SUPPLIER#${supplierId}`,
        ':sk': 'ITEM#',
      },
      ScanIndexForward: false,
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as Item[];
  }

  async getItemById(supplierId: string, itemId: string): Promise<Item | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `SUPPLIER#${supplierId}`,
        SK: `ITEM#${itemId}`,
      },
    });

    const result = await this.db.client.send(command);
    return (result.Item as Item) || null;
  }

  async updateItem(item: Item): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `SUPPLIER#${item.supplier_id}`,
        SK: `ITEM#${item.item_id}`,
        ...item,
      },
    });

    await this.db.client.send(command);
  }

  async deleteItem(supplierId: string, itemId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: `SUPPLIER#${supplierId}`,
        SK: `ITEM#${itemId}`,
      },
    });

    await this.db.client.send(command);
  }

  async getAllItems(): Promise<Item[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'begins_with(PK, :pk) AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': 'SUPPLIER#',
        ':sk': 'ITEM#',
      },
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as Item[];
  }

  async getItemsByStatus(status: string): Promise<Item[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression:
        'begins_with(PK, :pk) AND begins_with(SK, :sk) AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':pk': 'SUPPLIER#',
        ':sk': 'ITEM#',
        ':status': status,
      },
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as Item[];
  }
}
