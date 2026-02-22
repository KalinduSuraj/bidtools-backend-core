import { Test, TestingModule } from '@nestjs/testing';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { Item } from './entities/item.entity';
import { NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Mock the JwtAuthGuard
jest.mock('../auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

describe('ItemController', () => {
  let controller: ItemController;
  let service: ItemService;

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

  const mockItemService = {
    createItem: jest.fn(),
    getAllItems: jest.fn(),
    getItemsByStatus: jest.fn(),
    getItemsBySupplier: jest.fn(),
    getItemById: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    changeStatus: jest.fn(),
    getItemByIdOnly: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemController],
      providers: [
        {
          provide: ItemService,
          useValue: mockItemService,
        },
      ],
    }).compile();

    controller = module.get<ItemController>(ItemController);
    service = module.get<ItemService>(ItemService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const mockRequest = {
      user: {
        userId: mockSupplierId,
      },
    } as any;

    it('should create a new item', async () => {
      const createItemDto: CreateItemDto = {
        name: 'Excavator',
        description: 'Heavy duty excavator',
        price_per_day: 500,
        price_per_hour: 50,
        latitude: 6.9271,
        longitude: 79.8612,
      };

      mockItemService.createItem.mockResolvedValue(mockItem);

      const result = await controller.create(mockRequest, createItemDto);

      expect(result).toEqual(mockItem);
      expect(service.createItem).toHaveBeenCalledWith(mockSupplierId, createItemDto);
      expect(service.createItem).toHaveBeenCalledTimes(1);
    });

    it('should create item with default status as available', async () => {
      const createItemDto: CreateItemDto = {
        name: 'Crane',
        price_per_day: 1000,
        price_per_hour: 100,
        latitude: 6.9271,
        longitude: 79.8612,
      };

      const expectedItem = { ...mockItem, name: 'Crane', status: 'available' };
      mockItemService.createItem.mockResolvedValue(expectedItem);

      const result = await controller.create(mockRequest, createItemDto);

      expect(result.status).toBe('available');
    });
  });

  describe('findAll', () => {
    it('should return all items when no status filter', async () => {
      const items = [mockItem, { ...mockItem, item_id: 'another-id' }];
      mockItemService.getAllItems.mockResolvedValue(items);

      const result = await controller.findAll();

      expect(result).toEqual(items);
      expect(service.getAllItems).toHaveBeenCalledTimes(1);
      expect(service.getItemsByStatus).not.toHaveBeenCalled();
    });

    it('should return items filtered by status', async () => {
      const availableItems = [mockItem];
      mockItemService.getItemsByStatus.mockResolvedValue(availableItems);

      const result = await controller.findAll('available');

      expect(result).toEqual(availableItems);
      expect(service.getItemsByStatus).toHaveBeenCalledWith('available');
      expect(service.getAllItems).not.toHaveBeenCalled();
    });

    it('should return empty array when no items found', async () => {
      mockItemService.getAllItems.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findBySupplier', () => {
    it('should return all items for a supplier', async () => {
      const supplierItems = [mockItem];
      mockItemService.getItemsBySupplier.mockResolvedValue(supplierItems);

      const result = await controller.findBySupplier(mockSupplierId);

      expect(result).toEqual(supplierItems);
      expect(service.getItemsBySupplier).toHaveBeenCalledWith(mockSupplierId);
    });

    it('should return empty array when supplier has no items', async () => {
      mockItemService.getItemsBySupplier.mockResolvedValue([]);

      const result = await controller.findBySupplier(mockSupplierId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single item', async () => {
      mockItemService.getItemById.mockResolvedValue(mockItem);

      const result = await controller.findOne(mockSupplierId, mockItemId);

      expect(result).toEqual(mockItem);
      expect(service.getItemById).toHaveBeenCalledWith(
        mockSupplierId,
        mockItemId,
      );
    });

    it('should throw NotFoundException when item not found', async () => {
      mockItemService.getItemById.mockRejectedValue(
        new NotFoundException('Item not found'),
      );

      await expect(
        controller.findOne(mockSupplierId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an item', async () => {
      const updateItemDto: UpdateItemDto = {
        name: 'Updated Excavator',
        price_per_day: 600,
      };

      const updatedItem = { ...mockItem, ...updateItemDto };
      mockItemService.updateItem.mockResolvedValue(updatedItem);

      const result = await controller.update(
        mockSupplierId,
        mockItemId,
        updateItemDto,
      );

      expect(result).toEqual(updatedItem);
      expect(service.updateItem).toHaveBeenCalledWith(
        mockSupplierId,
        mockItemId,
        updateItemDto,
      );
    });

    it('should update item status', async () => {
      const updateItemDto: UpdateItemDto = {
        status: 'rented',
      };

      const updatedItem = { ...mockItem, status: 'rented' as const };
      mockItemService.updateItem.mockResolvedValue(updatedItem);

      const result = await controller.update(
        mockSupplierId,
        mockItemId,
        updateItemDto,
      );

      expect(result.status).toBe('rented');
    });

    it('should throw NotFoundException when updating non-existent item', async () => {
      mockItemService.updateItem.mockRejectedValue(
        new NotFoundException('Item not found'),
      );

      await expect(
        controller.update(mockSupplierId, 'non-existent-id', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an item', async () => {
      const deleteMessage = `Item with ID "${mockItemId}" has been deleted`;
      mockItemService.deleteItem.mockResolvedValue(deleteMessage);

      const result = await controller.remove(mockSupplierId, mockItemId);

      expect(result).toBe(deleteMessage);
      expect(service.deleteItem).toHaveBeenCalledWith(
        mockSupplierId,
        mockItemId,
      );
    });

    it('should throw NotFoundException when deleting non-existent item', async () => {
      mockItemService.deleteItem.mockRejectedValue(
        new NotFoundException('Item not found'),
      );

      await expect(
        controller.remove(mockSupplierId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeStatus', () => {
    it('should change item status', async () => {
      const changeStatusDto: ChangeStatusDto = {
        status: 'rented',
      };

      const updatedItem = { ...mockItem, status: 'rented' as const };
      mockItemService.changeStatus.mockResolvedValue(updatedItem);

      const result = await controller.changeStatus(
        mockSupplierId,
        mockItemId,
        changeStatusDto,
      );

      expect(result).toEqual(updatedItem);
      expect(service.changeStatus).toHaveBeenCalledWith(
        mockSupplierId,
        mockItemId,
        'rented',
      );
    });

    it('should throw NotFoundException when changing status of non-existent item', async () => {
      const changeStatusDto: ChangeStatusDto = {
        status: 'maintenance',
      };

      mockItemService.changeStatus.mockRejectedValue(
        new NotFoundException('Item not found'),
      );

      await expect(
        controller.changeStatus(mockSupplierId, 'non-existent-id', changeStatusDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByItemId', () => {
    it('should return item by item_id using GSI1', async () => {
      mockItemService.getItemByIdOnly.mockResolvedValue(mockItem);

      const result = await controller.findByItemId(mockItemId);

      expect(result).toEqual(mockItem);
      expect(service.getItemByIdOnly).toHaveBeenCalledWith(mockItemId);
    });

    it('should throw NotFoundException when item not found by item_id', async () => {
      mockItemService.getItemByIdOnly.mockRejectedValue(
        new NotFoundException('Item not found'),
      );

      await expect(
        controller.findByItemId('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
