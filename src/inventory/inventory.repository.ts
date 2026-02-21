import { Injectable } from '@nestjs/common';
import { DynomodbService } from '../common/dynomodb/dynomodb.service';
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  InventoryItem,
  InventoryReservation,
  InventoryStatus,
  ReservationStatus,
} from './entities/inventory-item.entity';

/**
 * Repository layer for Inventory operations with DynamoDB
 *
 * Table Design:
 * - Primary Key: PK (Partition Key), SK (Sort Key)
 * - GSI1: GSI1PK, GSI1SK (for category queries)
 * - GSI2: GSI2PK, GSI2SK (for status queries)
 *
 * Inventory Items:
 *   PK: "INVENTORY", SK: "ITEM#<inventory_id>"
 *   GSI1PK: "CATEGORY#<category>", GSI1SK: "ITEM#<inventory_id>"
 *   GSI2PK: "STATUS#<status>", GSI2SK: "ITEM#<inventory_id>"
 *
 * Reservations:
 *   PK: "RESERVATION", SK: "ITEM#<inventory_id>#<reservation_id>"
 *   GSI1PK: "INVENTORY#<inventory_id>", GSI1SK: "<start_date>#<end_date>"
 */
@Injectable()
export class InventoryRepository {
  private tableName = process.env.DYNAMODB_TABLE!;

  constructor(private readonly db: DynomodbService) {}

  // ==================== INVENTORY ITEMS ====================

  /**
   * Get all inventory items (non-deleted)
   */
  async getAllInventoryItems(): Promise<InventoryItem[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      FilterExpression: 'is_deleted = :is_deleted',
      ExpressionAttributeValues: {
        ':pk': 'INVENTORY',
        ':is_deleted': false,
      },
      ScanIndexForward: false,
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as InventoryItem[];
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItemById(
    inventoryId: string,
  ): Promise<InventoryItem | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: 'INVENTORY',
        SK: `ITEM#${inventoryId}`,
      },
    });

    const result = await this.db.client.send(command);
    const item = result.Item as InventoryItem;

    if (!item || item.is_deleted) {
      return null;
    }

    return item;
  }

  /**
   * Get inventory items by category
   */
  async getInventoryItemsByCategory(
    category: string,
  ): Promise<InventoryItem[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      FilterExpression: 'is_deleted = :is_deleted',
      ExpressionAttributeValues: {
        ':gsi1pk': `CATEGORY#${category}`,
        ':is_deleted': false,
      },
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as InventoryItem[];
  }

  /**
   * Get inventory items by status
   */
  async getInventoryItemsByStatus(
    status: InventoryStatus,
  ): Promise<InventoryItem[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk',
      FilterExpression: 'is_deleted = :is_deleted',
      ExpressionAttributeValues: {
        ':gsi2pk': `STATUS#${status}`,
        ':is_deleted': false,
      },
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as InventoryItem[];
  }

  /**
   * Get available inventory items
   */
  async getAvailableInventoryItems(): Promise<InventoryItem[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      FilterExpression:
        'is_deleted = :is_deleted AND available_quantity > :zero',
      ExpressionAttributeValues: {
        ':pk': 'INVENTORY',
        ':is_deleted': false,
        ':zero': 0,
      },
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as InventoryItem[];
  }

  /**
   * Save a new inventory item
   */
  async saveInventoryItem(item: InventoryItem): Promise<void> {
    const now = new Date().toISOString();
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: 'INVENTORY',
        SK: `ITEM#${item.inventory_id}`,
        GSI1PK: `CATEGORY#${item.category}`,
        GSI1SK: `ITEM#${item.inventory_id}`,
        GSI2PK: `STATUS#${item.status}`,
        GSI2SK: `ITEM#${item.inventory_id}`,
        ...item,
        created_at: item.created_at || now,
        updated_at: now,
      },
    });

    await this.db.client.send(command);
  }

  /**
   * Update an inventory item
   */
  async updateInventoryItem(item: InventoryItem): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: 'INVENTORY',
        SK: `ITEM#${item.inventory_id}`,
        GSI1PK: `CATEGORY#${item.category}`,
        GSI1SK: `ITEM#${item.inventory_id}`,
        GSI2PK: `STATUS#${item.status}`,
        GSI2SK: `ITEM#${item.inventory_id}`,
        ...item,
        updated_at: new Date().toISOString(),
      },
    });

    await this.db.client.send(command);
  }

  /**
   * Update inventory quantities
   */
  async updateInventoryQuantities(
    inventoryId: string,
    availableQuantity: number,
    reservedQuantity: number,
    status: InventoryStatus,
  ): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: 'INVENTORY',
        SK: `ITEM#${inventoryId}`,
      },
      UpdateExpression:
        'SET available_quantity = :available, reserved_quantity = :reserved, #status = :status, GSI2PK = :gsi2pk, updated_at = :updated_at',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':available': availableQuantity,
        ':reserved': reservedQuantity,
        ':status': status,
        ':gsi2pk': `STATUS#${status}`,
        ':updated_at': new Date().toISOString(),
      },
    });

    await this.db.client.send(command);
  }

  /**
   * Soft delete an inventory item
   */
  async deleteInventoryItem(inventoryId: string): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: 'INVENTORY',
        SK: `ITEM#${inventoryId}`,
      },
      UpdateExpression:
        'SET is_deleted = :is_deleted, updated_at = :updated_at',
      ExpressionAttributeValues: {
        ':is_deleted': true,
        ':updated_at': new Date().toISOString(),
      },
    });

    await this.db.client.send(command);
  }

  // ==================== RESERVATIONS ====================

  /**
   * Get all reservations for an inventory item
   */
  async getReservationsByInventoryId(
    inventoryId: string,
  ): Promise<InventoryReservation[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `INVENTORY#${inventoryId}`,
      },
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as InventoryReservation[];
  }

  /**
   * Get active and confirmed reservations for an inventory item
   * Used for availability checking
   */
  async getActiveReservations(
    inventoryId: string,
  ): Promise<InventoryReservation[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      FilterExpression: '#status IN (:pending, :confirmed, :active)',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':gsi1pk': `INVENTORY#${inventoryId}`,
        ':pending': 'PENDING',
        ':confirmed': 'CONFIRMED',
        ':active': 'ACTIVE',
      },
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as InventoryReservation[];
  }

  /**
   * Get reservation by ID
   */
  async getReservationById(
    inventoryId: string,
    reservationId: string,
  ): Promise<InventoryReservation | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: 'RESERVATION',
        SK: `ITEM#${inventoryId}#${reservationId}`,
      },
    });

    const result = await this.db.client.send(command);
    return (result.Item as InventoryReservation) || null;
  }

  /**
   * Save a new reservation
   */
  async saveReservation(reservation: InventoryReservation): Promise<void> {
    const now = new Date().toISOString();
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: 'RESERVATION',
        SK: `ITEM#${reservation.inventory_id}#${reservation.reservation_id}`,
        GSI1PK: `INVENTORY#${reservation.inventory_id}`,
        GSI1SK: `${reservation.start_date}#${reservation.end_date}`,
        ...reservation,
        created_at: reservation.created_at || now,
        updated_at: now,
      },
    });

    await this.db.client.send(command);
  }

  /**
   * Update a reservation
   */
  async updateReservation(reservation: InventoryReservation): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: 'RESERVATION',
        SK: `ITEM#${reservation.inventory_id}#${reservation.reservation_id}`,
        GSI1PK: `INVENTORY#${reservation.inventory_id}`,
        GSI1SK: `${reservation.start_date}#${reservation.end_date}`,
        ...reservation,
        updated_at: new Date().toISOString(),
      },
    });

    await this.db.client.send(command);
  }

  /**
   * Update reservation status
   */
  async updateReservationStatus(
    inventoryId: string,
    reservationId: string,
    status: ReservationStatus,
  ): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: 'RESERVATION',
        SK: `ITEM#${inventoryId}#${reservationId}`,
      },
      UpdateExpression: 'SET #status = :status, updated_at = :updated_at',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updated_at': new Date().toISOString(),
      },
    });

    await this.db.client.send(command);
  }

  /**
   * Delete a reservation (hard delete)
   */
  async deleteReservation(
    inventoryId: string,
    reservationId: string,
  ): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: 'RESERVATION',
        SK: `ITEM#${inventoryId}#${reservationId}`,
      },
    });

    await this.db.client.send(command);
  }

  /**
   * Search inventory items by name or tags
   */
  async searchInventoryItems(searchTerm: string): Promise<InventoryItem[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression:
        'PK = :pk AND is_deleted = :is_deleted AND (contains(#name, :search) OR contains(description, :search))',
      ExpressionAttributeNames: {
        '#name': 'name',
      },
      ExpressionAttributeValues: {
        ':pk': 'INVENTORY',
        ':is_deleted': false,
        ':search': searchTerm.toLowerCase(),
      },
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as InventoryItem[];
  }
}
