import { Test, TestingModule } from '@nestjs/testing';
import { ItemRepository } from './item.repository';
import { DynomodbService } from '../common/dynomodb/dynomodb.service';
import { Item } from './entities/item.entity';

describe('ItemRepository', () => {
  let repository: ItemRepository;
  let dbService: DynomodbService;

  const mockSupplierId = '123e4567-e89b-12d3-a456-426614174000';
  const mockItemId = '123e4567-e89b-12d3-a456-426614174001';

  const mockItem: Item = {
    item_id: mockItemId,
    supplier_id: mockSupplierId,
    name: 'Excavator',
    description: 'Heavy duty excavator',
    price_per_day: 500,
    price_per_hour: 50,
    status: 'available',
    latitude: 6.9271,
    longitude: 79.8612,
    created_at: '2026-02-21T10:00:00.000Z',
  };

  const mockSend = jest.fn();
  const mockClient = {
    send: mockSend,
  };

  const mockDynomodbService = {
    client: mockClient,
  };

  beforeEach(async () => {
    // Set environment variable
    process.env.DYNAMODB_TABLE = 'test-table';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemRepository,
        {
          provide: DynomodbService,
          useValue: mockDynomodbService,
        },
      ],
    }).compile();

    repository = module.get<ItemRepository>(ItemRepository);
    dbService = module.get<DynomodbService>(DynomodbService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('saveItem', () => {
    it('should save an item with correct PK and SK', async () => {
      mockSend.mockResolvedValue({});

      await repository.saveItem(mockItem);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.TableName).toBe('test-table');
      expect(command.input.Item.PK).toBe(`SUPPLIER#${mockSupplierId}`);
      expect(command.input.Item.SK).toBe(`ITEM#${mockItemId}`);
      expect(command.input.Item.name).toBe('Excavator');
    });

    it('should include all item properties', async () => {
      mockSend.mockResolvedValue({});

      await repository.saveItem(mockItem);

      const command = mockSend.mock.calls[0][0];
      expect(command.input.Item.price_per_day).toBe(500);
      expect(command.input.Item.price_per_hour).toBe(50);
      expect(command.input.Item.latitude).toBe(6.9271);
      expect(command.input.Item.longitude).toBe(79.8612);
      expect(command.input.Item.status).toBe('available');
    });
  });

  describe('getItemsBySupplier', () => {
    it('should query items by supplier PK', async () => {
      mockSend.mockResolvedValue({
        Items: [mockItem],
      });

      const result = await repository.getItemsBySupplier(mockSupplierId);

      expect(result).toEqual([mockItem]);
      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.KeyConditionExpression).toBe(
        'PK = :pk AND begins_with(SK, :sk)',
      );
      expect(command.input.ExpressionAttributeValues[':pk']).toBe(
        `SUPPLIER#${mockSupplierId}`,
      );
      expect(command.input.ExpressionAttributeValues[':sk']).toBe('ITEM#');
    });

    it('should return empty array when no items found', async () => {
      mockSend.mockResolvedValue({
        Items: [],
      });

      const result = await repository.getItemsBySupplier(mockSupplierId);

      expect(result).toEqual([]);
    });

    it('should handle undefined Items response', async () => {
      mockSend.mockResolvedValue({});

      const result = await repository.getItemsBySupplier(mockSupplierId);

      expect(result).toEqual([]);
    });
  });

  describe('getItemById', () => {
    it('should get item by supplier and item id', async () => {
      mockSend.mockResolvedValue({
        Item: mockItem,
      });

      const result = await repository.getItemById(mockSupplierId, mockItemId);

      expect(result).toEqual(mockItem);
      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Key.PK).toBe(`SUPPLIER#${mockSupplierId}`);
      expect(command.input.Key.SK).toBe(`ITEM#${mockItemId}`);
    });

    it('should return null when item not found', async () => {
      mockSend.mockResolvedValue({});

      const result = await repository.getItemById(
        mockSupplierId,
        'non-existent',
      );

      expect(result).toBeNull();
    });
  });

  describe('updateItem', () => {
    it('should update item with correct PK and SK', async () => {
      mockSend.mockResolvedValue({});

      await repository.updateItem(mockItem);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Item.PK).toBe(`SUPPLIER#${mockSupplierId}`);
      expect(command.input.Item.SK).toBe(`ITEM#${mockItemId}`);
    });

    it('should preserve all item properties on update', async () => {
      mockSend.mockResolvedValue({});

      const updatedItem = { ...mockItem, name: 'Updated Excavator' };
      await repository.updateItem(updatedItem);

      const command = mockSend.mock.calls[0][0];
      expect(command.input.Item.name).toBe('Updated Excavator');
      expect(command.input.Item.price_per_day).toBe(500);
    });
  });

  describe('deleteItem', () => {
    it('should delete item with correct PK and SK', async () => {
      mockSend.mockResolvedValue({});

      await repository.deleteItem(mockSupplierId, mockItemId);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Key.PK).toBe(`SUPPLIER#${mockSupplierId}`);
      expect(command.input.Key.SK).toBe(`ITEM#${mockItemId}`);
    });
  });

  describe('getAllItems', () => {
    it('should scan all items excluding soft-deleted', async () => {
      const items = [mockItem, { ...mockItem, item_id: 'another-id' }];
      mockSend.mockResolvedValue({
        Items: items,
      });

      const result = await repository.getAllItems();

      expect(result).toEqual(items);
      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.FilterExpression).toBe(
        'begins_with(PK, :pk) AND begins_with(SK, :sk) AND (attribute_not_exists(is_deleted) OR is_deleted = :false)',
      );
    });

    it('should return empty array when no items', async () => {
      mockSend.mockResolvedValue({});

      const result = await repository.getAllItems();

      expect(result).toEqual([]);
    });
  });

  describe('getItemsByStatus', () => {
    it('should filter items by status', async () => {
      mockSend.mockResolvedValue({
        Items: [mockItem],
      });

      const result = await repository.getItemsByStatus('available');

      expect(result).toEqual([mockItem]);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.FilterExpression).toContain('#status = :status');
      expect(command.input.ExpressionAttributeNames['#status']).toBe('status');
      expect(command.input.ExpressionAttributeValues[':status']).toBe(
        'available',
      );
    });

    it('should return empty array when no items match status', async () => {
      mockSend.mockResolvedValue({
        Items: [],
      });

      const result = await repository.getItemsByStatus('maintenance');

      expect(result).toEqual([]);
    });
  });
});
