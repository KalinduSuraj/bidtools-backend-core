import { Injectable } from '@nestjs/common';
import { DynomodbService } from '../common/dynomodb/dynomodb.service';
import { User } from './entities/user.entity';
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class UsersRepository {
  private tableName = process.env.DYNAMODB_TABLE!;

  constructor(private readonly db: DynomodbService) {}

  async saveUser(user: User): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${user.user_id}`,
        SK: 'METADATA',
        ...user,
      },
    });

    await this.db.client.send(command);
  }

  async getUserById(userId: string): Promise<User | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: 'METADATA',
      },
    });

    const result = await this.db.client.send(command);
    return (result.Item as User) || null;
  }

  async getAllUsers(): Promise<User[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'begins_with(PK, :pk) AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': 'USER#',
        ':sk': 'METADATA',
      },
    });

    // QueryCommand requires PK = :pk, but for prefix scans we need a Scan
    // Using ScanCommand instead since PK is not a single partition key value
    const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
    const scanCommand = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'begins_with(PK, :pk) AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': 'USER#',
        ':sk': 'METADATA',
      },
    });

    const result = await this.db.client.send(scanCommand);
    return (result.Items || []) as User[];
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    // Build update expression dynamically
    const expressionParts: string[] = [];
    const expressionValues: Record<string, any> = {};
    const expressionNames: Record<string, string> = {};

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined && key !== 'user_id') {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        expressionParts.push(`${attrName} = ${attrValue}`);
        expressionNames[attrName] = key;
        expressionValues[attrValue] = value;
      }
    });

    if (expressionParts.length === 0) return;

    // Always add updated_at
    expressionParts.push('#updatedAt = :updatedAt');
    expressionNames['#updatedAt'] = 'updated_at';
    expressionValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: 'METADATA',
      },
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
    });

    await this.db.client.send(command);
  }

  async deleteUser(userId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: 'METADATA',
      },
    });

    await this.db.client.send(command);
  }
}
