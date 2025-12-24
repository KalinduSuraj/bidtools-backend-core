import { Test, TestingModule } from '@nestjs/testing';
import { PaymentRepository } from './payment.repository';
import { DynomodbService } from '../common/dynomodb/dynomodb.service';
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Payment } from './entities/payment.entity';

describe('PaymentRepository', () => {
  let repository: PaymentRepository;
  let sendMock: jest.Mock;

  beforeEach(async () => {
    process.env.DYNAMODB_TABLE = 'TEST_TABLE';
    sendMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRepository,
        {
          provide: DynomodbService,
          useValue: {
            client: {
              send: sendMock,
            },
          },
        },
      ],
    }).compile();

    repository = module.get<PaymentRepository>(PaymentRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getAllPayments', () => {
    it('should return an array of payments', async () => {
      const mockPayments = [{ payment_id: '1' }, { payment_id: '2' }];
      sendMock.mockResolvedValue({ Items: mockPayments });

      const result = await repository.getAllPayments();

      expect(result).toEqual(mockPayments);
      expect(sendMock).toHaveBeenCalledWith(expect.any(QueryCommand));
      const command = sendMock.mock.calls[0][0] as QueryCommand;
      expect(command.input.TableName).toBeDefined();
      expect(command.input.KeyConditionExpression).toBe('PK = :pk');
      expect(command.input.FilterExpression).toBe('is_deleted = :is_deleted');
    });

    it('should return an empty array if no items found', async () => {
      sendMock.mockResolvedValue({ Items: undefined });

      const result = await repository.getAllPayments();

      expect(result).toEqual([]);
    });
  });

  describe('getPaymentById', () => {
    it('should return a payment if found', async () => {
      const mockPayment = { payment_id: '1', is_deleted: false };
      sendMock.mockResolvedValue({ Item: mockPayment });

      const result = await repository.getPaymentById('1');

      expect(result).toEqual(mockPayment);
      expect(sendMock).toHaveBeenCalledWith(expect.any(GetCommand));
      const command = sendMock.mock.calls[0][0] as GetCommand;
      expect(command.input.Key).toEqual({ PK: 'PAYMENT', SK: 'ITEM#1' });
    });

    it('should return null if payment not found', async () => {
      sendMock.mockResolvedValue({ Item: undefined });

      const result = await repository.getPaymentById('1');

      expect(result).toBeNull();
    });

    it('should return null if payment is deleted', async () => {
      const mockPayment = { payment_id: '1', is_deleted: true };
      sendMock.mockResolvedValue({ Item: mockPayment });

      const result = await repository.getPaymentById('1');

      expect(result).toBeNull();
    });
  });

  describe('updatePaymentDetails', () => {
    it('should update payment details', async () => {
      const mockPayment: Payment = {
        payment_id: '1',
        status: 'SUCCESS',
      } as any;
      sendMock.mockResolvedValue({});

      await repository.updatePaymentDetails(mockPayment);

      expect(sendMock).toHaveBeenCalledWith(expect.any(PutCommand));
      const command = sendMock.mock.calls[0][0] as PutCommand;
      expect(command.input.Item).toEqual(
        expect.objectContaining({
          PK: 'PAYMENT',
          SK: 'ITEM#1',
          payment_id: '1',
          status: 'SUCCESS',
        }),
      );
      expect(command.input.Item.updatedAt).toBeDefined();
    });
  });

  describe('deletePayment', () => {
    it('should soft delete a payment', async () => {
      sendMock.mockResolvedValue({});

      await repository.deletePayment('1');

      expect(sendMock).toHaveBeenCalledWith(expect.any(UpdateCommand));
      const command = sendMock.mock.calls[0][0] as UpdateCommand;
      expect(command.input.Key).toEqual({ PK: 'PAYMENT', SK: 'ITEM#1' });
      expect(command.input.UpdateExpression).toBe(
        'set is_deleted = :is_deleted',
      );
      expect(command.input.ExpressionAttributeValues).toEqual({
        ':is_deleted': true,
      });
    });
  });

  describe('savePayment', () => {
    it('should save a new payment', async () => {
      const mockPayment: Payment = {
        payment_id: '1',
        created_at: new Date(),
      } as any;
      sendMock.mockResolvedValue({});

      await repository.savePayment(mockPayment);

      expect(sendMock).toHaveBeenCalledWith(expect.any(PutCommand));
      const command = sendMock.mock.calls[0][0] as PutCommand;
      expect(command.input.Item).toEqual(
        expect.objectContaining({
          PK: 'PAYMENT',
          SK: 'ITEM#1',
          payment_id: '1',
        }),
      );
      expect(command.input.Item.created_at).toBeDefined();
      expect(command.input.Item.updatedAt).toBeDefined();
    });
  });
});
