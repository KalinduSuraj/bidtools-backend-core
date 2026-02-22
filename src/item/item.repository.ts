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
  private gsi1IndexName = process.env.DYNAMODB_GSI1_INDEX || 'GSI1';

  constructor(private readonly db: DynomodbService) {}

  /**
   * Save item with GSI1 keys for direct item lookup
   * PK: SUPPLIER#<supplier_id>, SK: ITEM#<item_id>
   * GSI1PK: ITEM#<item_id>, GSI1SK: METADATA
   */
  async saveItem(item: Item): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `SUPPLIER#${item.supplier_id}`,
        SK: `ITEM#${item.item_id}`,
        GSI1PK: `ITEM#${item.item_id}`,
        GSI1SK: 'METADATA',
        ...item,
      },
    });

    await this.db.client.send(command);
  }

  /**
   * Get all items for a supplier
   * Query: PK = SUPPLIER#<supplier_id>
   */
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

  /**
   * Get item by supplier_id and item_id (main table)
   */
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

  /**
   * Get item by item_id only using GSI1
   * Query: GSI1PK = ITEM#<item_id>
   */
  async getItemByIdOnly(itemId: string): Promise<Item | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: this.gsi1IndexName,
      KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `ITEM#${itemId}`,
        ':sk': 'METADATA',
      },
    });

    const result = await this.db.client.send(command);
    return (result.Items?.[0] as Item) || null;
  }

  /**
   * Update item with GSI1 keys
   */
  async updateItem(item: Item): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `SUPPLIER#${item.supplier_id}`,
        SK: `ITEM#${item.item_id}`,
        GSI1PK: `ITEM#${item.item_id}`,
        GSI1SK: 'METADATA',
        ...item,
      },
    });

    await this.db.client.send(command);
  }

  /**
   * Delete item by supplier_id and item_id
   */
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

  /**
   * Get all items (scan - use sparingly)
   */
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

  /**
   * Get items by status (scan with filter)
   */
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
