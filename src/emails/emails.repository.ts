import { Injectable } from '@nestjs/common';
import { DynomodbService } from '../common/dynomodb/dynomodb.service';
import { Email } from './entities/email.entity';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';

@Injectable()
export class EmailsRepository {
  private tableName = process.env.DYNAMODB_TABLE!;

  constructor(private readonly db: DynomodbService) {}

  async saveEmailLog(email: Email) {
    const emailId = uuid();
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: 'EMAIL',
        SK: `ITEM#${emailId}`,
        ...email,
        createdAt: new Date().toISOString(),
      },
    });

    await this.db.client.send(command);
  }
}
