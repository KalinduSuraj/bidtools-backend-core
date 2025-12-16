import { Injectable } from '@nestjs/common';
import { DynomodbService } from '../common/dynomodb/dynomodb.service';
import { Notification } from './entities/notification.entity';
// Import QueryCommand here
import { PutCommand, QueryCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class NotificationsRepository {
  private tableName = process.env.DYNAMODB_TABLE!;

  constructor(private readonly db: DynomodbService) {}

  async saveNotification(notification: Notification) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: 'NOTIFICATION',
        SK: `ITEM#${Date.now()}`,
        ...notification,
        createdAt: new Date().toISOString(),
      },
    });

    await this.db.client.send(command);
  }

  async getAllNotification() {
    const command = new QueryCommand({
      TableName: this.tableName,
      // We only look for items where PK matches 'NOTIFICATION'
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'NOTIFICATION',
      },
      // Optional: Set to false to show newest notifications first (descending order)
      ScanIndexForward: false,
    });

    const result = await this.db.client.send(command);

    // Return the items or an empty array if none found
    return (result.Items || []) as Notification[];
  }

  async getNotificationById(
    notificationId: string,
  ): Promise<Notification | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: 'NOTIFICATION',
        SK: `ITEM#${notificationId}`,
      },
    });

    const result = await this.db.client.send(command);
    return (result.Item as Notification) || null;
  }
  async deleteNotification(notificationId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: 'NOTIFICATION',           // Must match the PK
        SK: `ITEM#${notificationId}`, // Must match the SK
      },
    });

    await this.db.client.send(command);
  }
  async updateNotification(notification: Notification) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: 'NOTIFICATION',
        SK: `ITEM#${notification.notification_id}`,
        ...notification,
        // Optional: Update an 'updatedAt' field if you have one
        updatedAt: new Date().toISOString(), 
      },
    });

    await this.db.client.send(command);
  }
}
