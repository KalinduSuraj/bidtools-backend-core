import { Injectable } from '@nestjs/common';
import { DynomodbService } from '../common/dynomodb/dynomodb.service';
import { Notification } from './entities/notification.entity';
// Import QueryCommand here
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class NotificationsRepository {
  private tableName = process.env.DYNAMODB_TABLE!;

  constructor(private readonly db: DynomodbService) {}

  /**
   * Save a notification scoped to a user. The caller should provide
   * notification fields (type, message, is_read) and a timestamp/ID will be used
   * to build the SK. This stores items with PK = USER#<userId> and SK = NOTIFICATION#<ts>
   */
  async saveNotificationForUser(
    userId: string,
    notification: Partial<Notification>,
  ) {
    const ts = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, '')
      .slice(0, 14); // YYYYMMDDHHMMSS
    const sk = `NOTIFICATION#${ts}`;

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${userId}`,
        SK: sk,
        type: notification.type,
        message: notification.message,
        is_read: notification.is_read ?? false,
        created_at: new Date().toISOString(),
      },
    });

    await this.db.client.send(command);

    return { PK: `USER#${userId}`, SK: sk };
  }

  /**
   * Query notifications for a specific user. Items stored with PK = USER#<userId>
   */
  async getNotificationsByUser(userId: string) {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
      },
      ScanIndexForward: false,
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as Notification[];
  }

  /**
   * Count unread notifications for a user.
   */
  async getUnreadCountForUser(userId: string) {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':false': false,
      },
      FilterExpression: 'is_read = :false',
      Select: 'COUNT',
    });

    const result = await this.db.client.send(command);
    return result.Count ?? 0;
  }

  /**
   * Mark a specific user notification (by PK and SK) as read.
   * Uses an Update-style Put here for simplicity (overwrites existing item keys).
   */
  async markNotificationAsRead(userId: string, sk: string) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${userId}`,
        SK: sk,
        is_read: true,
        updated_at: new Date().toISOString(),
      },
    });

    await this.db.client.send(command);
  }
}
