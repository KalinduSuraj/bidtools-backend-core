import { Injectable } from '@nestjs/common';
import { DynomodbService } from '../common/dynomodb/dynomodb.service';
import { Job } from './entities/job.entity';
import { PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class JobRepository {
  private tableName = process.env.DYNAMODB_TABLE!;
  private gsi2IndexName = process.env.DYNAMODB_GSI2_INDEX || 'GSI2';

  constructor(private readonly db: DynomodbService) {}

  /**
   * Save job record
   * PK = CONTRACTOR#<contractor_id>
   * SK = JOB#<job_id>
   * GSI2PK = JOB#<job_id>
   * GSI2SK = METADATA
   */
  async saveJob(job: Job): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `CONTRACTOR#${job.contractor_id}`,
        SK: `JOB#${job.job_id}`,
        GSI2PK: `JOB#${job.job_id}`,
        GSI2SK: 'METADATA',
        ...job,
      },
    });

    await this.db.client.send(command);
  }

  /**
   * Get jobs for a contractor (by PK)
   */
  async getJobsByContractor(contractorId: string): Promise<Job[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `CONTRACTOR#${contractorId}`,
        ':sk': 'JOB#',
      },
      ScanIndexForward: false,
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as Job[];
  }

  /**
   * Get job by job_id using GSI2
   * Query: GSI2PK = JOB#<job_id>
   */
  async getJobByIdOnly(jobId: string): Promise<Job | null> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.gsi2IndexName,
        KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `JOB#${jobId}`,
          ':sk': 'METADATA',
        },
      });

      const result = await this.db.client.send(command);
      return (result.Items?.[0] as Job) || null;
    } catch (err: any) {
      // If the table doesn't have the GSI configured (e.g. local/dev),
      // fall back to a scan-based lookup. This is less efficient but
      // keeps the server functional until the GSI is provisioned.
      const msg =
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string'
          ? (err as { message: string }).message
          : '';
      if (
        msg.includes('does not have the specified index') ||
        (typeof err === 'object' &&
          err !== null &&
          'name' in err &&
          (err as { name?: unknown }).name === 'ValidationException')
      ) {
        const scan = new ScanCommand({
          TableName: this.tableName,
          FilterExpression: 'contains(SK, :jobId)',
          ExpressionAttributeValues: {
            ':jobId': jobId,
          },
        });
        const result = await this.db.client.send(scan);
        return (result.Items?.[0] as Job) || null;
      }
      throw err;
    }
  }

  /**
   * Scan and return all jobs in the table (SK begins with JOB#)
   * Use sparingly; intended for supplier "nearby jobs" view where number of jobs is manageable.
   */
  async getAllJobs(): Promise<Job[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'begins_with(SK, :sk) AND begins_with(PK, :pk)',
      ExpressionAttributeValues: {
        ':sk': 'JOB#',
        ':pk': 'CONTRACTOR#',
      },
    });

    const result = await this.db.client.send(command);
    return (result.Items || []) as Job[];
  }

  /**
   * Update (put) job record
   */
  async updateJob(job: Job): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `CONTRACTOR#${job.contractor_id}`,
        SK: `JOB#${job.job_id}`,
        GSI2PK: `JOB#${job.job_id}`,
        GSI2SK: 'METADATA',
        ...job,
      },
    });

    await this.db.client.send(command);
  }

  /**
   * Create rental record under PK = JOB#<job_id>
   */
  // rental creation is handled by the reservation service; not implemented here
}
