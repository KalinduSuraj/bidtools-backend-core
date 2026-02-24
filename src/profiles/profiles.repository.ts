import { Injectable } from '@nestjs/common';
import { DynomodbService } from '../common/dynomodb/dynomodb.service';
import { Profile } from './entities/profile.entity';
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class ProfilesRepository {
  private tableName = process.env.DYNAMODB_TABLE!;

  constructor(private readonly db: DynomodbService) {}

  async saveProfile(profile: Profile): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${profile.user_id}`,
        SK: `PROFILE#${profile.profile_type}`,
        ...profile,
      },
    });

    await this.db.client.send(command);
  }

  async getProfileById(profileId: string): Promise<Profile | null> {
    // Profile ID-based lookup requires a scan since profileId is not PK/SK
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'begins_with(SK, :sk) AND profile_id = :profileId',
      ExpressionAttributeValues: {
        ':sk': 'PROFILE#',
        ':profileId': profileId,
      },
    });

    const result = await this.db.client.send(command);
    return (result.Items?.[0] as Profile) || null;
  }

  async getProfileByUserIdAndType(
    userId: string,
    profileType: string,
  ): Promise<Profile | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: `PROFILE#${profileType}`,
      },
    });

    const result = await this.db.client.send(command);
    return (result.Item as Profile) || null;
  }

  async getProfilesByUserId(userId: string): Promise<Profile[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'PROFILE#',
      },
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as Profile[];
  }

  async getAllProfiles(profileType?: string): Promise<Profile[]> {
    const filterParts = ['begins_with(SK, :sk)'];
    const expressionValues: Record<string, any> = {
      ':sk': 'PROFILE#',
    };

    if (profileType) {
      filterParts.push('profile_type = :profileType');
      expressionValues[':profileType'] = profileType;
    }

    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: filterParts.join(' AND '),
      ExpressionAttributeValues: expressionValues,
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as Profile[];
  }

  async updateProfile(
    userId: string,
    profileType: string,
    updates: Partial<Profile>,
  ): Promise<void> {
    const expressionParts: string[] = [];
    const expressionValues: Record<string, any> = {};
    const expressionNames: Record<string, string> = {};

    Object.entries(updates).forEach(([key, value], index) => {
      if (
        value !== undefined &&
        key !== 'user_id' &&
        key !== 'profile_id' &&
        key !== 'profile_type'
      ) {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        expressionParts.push(`${attrName} = ${attrValue}`);
        expressionNames[attrName] = key;
        expressionValues[attrValue] = value;
      }
    });

    if (expressionParts.length === 0) return;

    expressionParts.push('#updatedAt = :updatedAt');
    expressionNames['#updatedAt'] = 'updated_at';
    expressionValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: `PROFILE#${profileType}`,
      },
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
    });

    await this.db.client.send(command);
  }

  async deleteProfile(userId: string, profileType: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: `PROFILE#${profileType}`,
      },
    });

    await this.db.client.send(command);
  }
}
