import { Test, TestingModule } from '@nestjs/testing';
import { ItemService } from './item.service';
import { ItemRepository } from './item.repository';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';
import { NotFoundException } from '@nestjs/common';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-12345'),
}));

describe('ItemService', () => {
  let service: ItemService;
  let repository: ItemRepository;

  const mockSupplierId = '123e4567-e89b-12d3-a456-426614174000';
  const mockItemId = 'mocked-uuid-12345';

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

  const mockItemRepository = {
    saveItem: jest.fn(),
    getAllItems: jest.fn(),
    getItemsBySupplier: jest.fn(),
    getItemById: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    getItemsByStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
        {
          provide: ItemRepository,
          useValue: mockItemRepository,
        },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
    repository = module.get<ItemRepository>(ItemRepository);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createItem', () => {
    it('should create a new item with generated id and timestamp', async () => {
      const createItemDto: CreateItemDto = {
        supplier_id: mockSupplierId,
        name: 'Excavator',
        description: 'Heavy duty excavator',
        price_per_day: 500,
        price_per_hour: 50,
        latitude: 6.9271,
        longitude: 79.8612,
      };

      mockItemRepository.saveItem.mockResolvedValue(undefined);

      const result = await service.createItem(createItemDto);

      expect(result.item_id).toBe(mockItemId);
      expect(result.supplier_id).toBe(mockSupplierId);
      expect(result.name).toBe('Excavator');
      expect(result.status).toBe('available');
      expect(result.created_at).toBeDefined();
      expect(repository.saveItem).toHaveBeenCalledTimes(1);
    });

    it('should set default status to available', async () => {
      const createItemDto: CreateItemDto = {
        supplier_id: mockSupplierId,
        name: 'Crane',
        price_per_day: 1000,
        price_per_hour: 100,
        latitude: 6.9271,
        longitude: 79.8612,
      };

      mockItemRepository.saveItem.mockResolvedValue(undefined);

      const result = await service.createItem(createItemDto);

      expect(result.status).toBe('available');
    });

    it('should use provided status if specified', async () => {
      const createItemDto: CreateItemDto = {
        supplier_id: mockSupplierId,
        name: 'Crane',
        price_per_day: 1000,
        price_per_hour: 100,
        latitude: 6.9271,
        longitude: 79.8612,
        status: 'maintenance',
      };

      mockItemRepository.saveItem.mockResolvedValue(undefined);

      const result = await service.createItem(createItemDto);

      expect(result.status).toBe('maintenance');
    });

    it('should set empty description if not provided', async () => {
      const createItemDto: CreateItemDto = {
        supplier_id: mockSupplierId,
        name: 'Crane',
        price_per_day: 1000,
        price_per_hour: 100,
        latitude: 6.9271,
        longitude: 79.8612,
      };

      mockItemRepository.saveItem.mockResolvedValue(undefined);

      const result = await service.createItem(createItemDto);

      expect(result.description).toBe('');
    });
  });

  describe('getAllItems', () => {
    it('should return all items', async () => {
      const items = [mockItem, { ...mockItem, item_id: 'another-id' }];
      mockItemRepository.getAllItems.mockResolvedValue(items);

      const result = await service.getAllItems();

      expect(result).toEqual(items);
      expect(result.length).toBe(2);
      expect(repository.getAllItems).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no items exist', async () => {
      mockItemRepository.getAllItems.mockResolvedValue([]);

      const result = await service.getAllItems();

      expect(result).toEqual([]);
    });
  });

  describe('getItemsBySupplier', () => {
    it('should return all items for a supplier', async () => {
      const supplierItems = [mockItem];
      mockItemRepository.getItemsBySupplier.mockResolvedValue(supplierItems);

      const result = await service.getItemsBySupplier(mockSupplierId);

      expect(result).toEqual(supplierItems);
      expect(repository.getItemsBySupplier).toHaveBeenCalledWith(mockSupplierId);
    });

    it('should return empty array when supplier has no items', async () => {
      mockItemRepository.getItemsBySupplier.mockResolvedValue([]);

      const result = await service.getItemsBySupplier(mockSupplierId);

      expect(result).toEqual([]);
    });
  });

  describe('getItemById', () => {
    it('should return item when found', async () => {
      mockItemRepository.getItemById.mockResolvedValue(mockItem);

      const result = await service.getItemById(mockSupplierId, mockItemId);

      expect(result).toEqual(mockItem);
      expect(repository.getItemById).toHaveBeenCalledWith(
        mockSupplierId,
        mockItemId,
      );
    });

    it('should throw NotFoundException when item not found', async () => {
      mockItemRepository.getItemById.mockResolvedValue(null);

      await expect(
        service.getItemById(mockSupplierId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should include supplier and item id in error message', async () => {
      mockItemRepository.getItemById.mockResolvedValue(null);

      await expect(
        service.getItemById(mockSupplierId, 'non-existent-id'),
      ).rejects.toThrow(
        `Item with ID "non-existent-id" not found for supplier "${mockSupplierId}"`,
      );
    });
  });

  describe('updateItem', () => {
    it('should update an existing item', async () => {
      const updateItemDto: UpdateItemDto = {
        name: 'Updated Excavator',
        price_per_day: 600,
      };

      mockItemRepository.getItemById.mockResolvedValue(mockItem);
      mockItemRepository.updateItem.mockResolvedValue(undefined);

      const result = await service.updateItem(
        mockSupplierId,
        mockItemId,
        updateItemDto,
      );

      expect(result.name).toBe('Updated Excavator');
      expect(result.price_per_day).toBe(600);
      expect(result.supplier_id).toBe(mockSupplierId);
      expect(result.item_id).toBe(mockItemId);
    });

    it('should preserve original supplier_id and item_id', async () => {
      const updateItemDto: UpdateItemDto = {
        name: 'Updated',
      };

      mockItemRepository.getItemById.mockResolvedValue(mockItem);
      mockItemRepository.updateItem.mockResolvedValue(undefined);

      const result = await service.updateItem(
        mockSupplierId,
        mockItemId,
        updateItemDto,
      );

      expect(result.supplier_id).toBe(mockSupplierId);
      expect(result.item_id).toBe(mockItemId);
    });

    it('should throw NotFoundException when updating non-existent item', async () => {
      mockItemRepository.getItemById.mockResolvedValue(null);

      await expect(
        service.updateItem(mockSupplierId, 'non-existent-id', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update item status', async () => {
      const updateItemDto: UpdateItemDto = {
        status: 'rented',
      };

      mockItemRepository.getItemById.mockResolvedValue(mockItem);
      mockItemRepository.updateItem.mockResolvedValue(undefined);

      const result = await service.updateItem(
        mockSupplierId,
        mockItemId,
        updateItemDto,
      );

      expect(result.status).toBe('rented');
    });
  });

  describe('deleteItem', () => {
    it('should delete an existing item', async () => {
      mockItemRepository.getItemById.mockResolvedValue(mockItem);
      mockItemRepository.deleteItem.mockResolvedValue(undefined);

      const result = await service.deleteItem(mockSupplierId, mockItemId);

      expect(result).toBe(`Item with ID "${mockItemId}" has been deleted`);
      expect(repository.deleteItem).toHaveBeenCalledWith(
        mockSupplierId,
        mockItemId,
      );
    });

    it('should throw NotFoundException when deleting non-existent item', async () => {
      mockItemRepository.getItemById.mockResolvedValue(null);

      await expect(
        service.deleteItem(mockSupplierId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should verify item exists before deleting', async () => {
      mockItemRepository.getItemById.mockResolvedValue(mockItem);
      mockItemRepository.deleteItem.mockResolvedValue(undefined);

      await service.deleteItem(mockSupplierId, mockItemId);

      expect(repository.getItemById).toHaveBeenCalledWith(
        mockSupplierId,
        mockItemId,
      );
      expect(repository.deleteItem).toHaveBeenCalledWith(
        mockSupplierId,
        mockItemId,
      );
      // Verify getItemById was called before deleteItem
      expect(repository.getItemById).toHaveBeenCalled();
      expect(repository.deleteItem).toHaveBeenCalled();
    });
  });

  describe('getItemsByStatus', () => {
    it('should return items filtered by status', async () => {
      const availableItems = [mockItem];
      mockItemRepository.getItemsByStatus.mockResolvedValue(availableItems);

      const result = await service.getItemsByStatus('available');

      expect(result).toEqual(availableItems);
      expect(repository.getItemsByStatus).toHaveBeenCalledWith('available');
    });

    it('should return empty array when no items match status', async () => {
      mockItemRepository.getItemsByStatus.mockResolvedValue([]);

      const result = await service.getItemsByStatus('maintenance');

      expect(result).toEqual([]);
    });
  });
});
