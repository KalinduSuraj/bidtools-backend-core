import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

/**
 * User payload from JWT token (attached by JwtStrategy)
 */
interface JwtUser {
  userId: string; // sub from Cognito (supplier_id)
  email?: string;
  username?: string;
  'cognito:groups'?: string[];
  'custom:role'?: string;
}

/**
 * Controller for managing inventory items
 * Base route: /items
 */
@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  /**
   * Create a new item for the authenticated supplier
   * POST /items
   * Requires: Authorization Bearer token
   * @param req - Express request with authenticated user
   * @param createItemDto - Item data (name, prices, location)
   * @returns The newly created item
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request & { user: JwtUser },
    @Body() createItemDto: CreateItemDto,
  ): Promise<Item> {
    const supplierId = req.user.userId; // Get supplier_id from JWT
    return this.itemService.createItem(supplierId, createItemDto);
  }

  /**
   * Get all items or filter by status
   * GET /items
   * GET /items?status=available
   * @param status - Optional filter: 'available' | 'rented' | 'maintenance' | 'inactive'
   * @returns Array of items
   */
  @Get()
  async findAll(@Query('status') status?: string): Promise<Item[]> {
    if (status) {
      return this.itemService.getItemsByStatus(status);
    }
    return this.itemService.getAllItems();
  }

  /**
   * Get all items for a specific supplier
   * GET /items/supplier/:supplierId
   * @param supplierId - UUID of the supplier
   * @returns Array of items belonging to the supplier
   */
  @Get('supplier/:supplierId')
  async findBySupplier(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
  ): Promise<Item[]> {
    return this.itemService.getItemsBySupplier(supplierId);
  }

  /**
   * Get a specific item by supplier and item ID
   * GET /items/supplier/:supplierId/:itemId
   * @param supplierId - UUID of the supplier
   * @param itemId - UUID of the item
   * @returns The requested item
   * @throws NotFoundException if item not found
   */
  @Get('supplier/:supplierId/:itemId')
  async findOne(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<Item> {
    return this.itemService.getItemById(supplierId, itemId);
  }

  /**
   * Update an existing item
   * PUT /items/supplier/:supplierId/:itemId
   * @param supplierId - UUID of the supplier
   * @param itemId - UUID of the item
   * @param updateItemDto - Partial item data to update
   * @returns The updated item
   * @throws NotFoundException if item not found
   */
  @Put('supplier/:supplierId/:itemId')
  async update(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<Item> {
    return this.itemService.updateItem(supplierId, itemId, updateItemDto);
  }

  /**
   * Delete an item
   * DELETE /items/supplier/:supplierId/:itemId
   * @param supplierId - UUID of the supplier
   * @param itemId - UUID of the item
   * @returns Confirmation message
   * @throws NotFoundException if item not found
   */
  @Delete('supplier/:supplierId/:itemId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<string> {
    return this.itemService.deleteItem(supplierId, itemId);
  }

  /**
   * Get item by item ID only (uses GSI1 index)
   * GET /items/:itemId
   * Useful for public item pages where supplier_id is unknown
   * @param itemId - UUID of the item
   * @returns The requested item
   * @throws NotFoundException if item not found
   */
  @Get(':itemId')
  async findByItemId(
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<Item> {
    return this.itemService.getItemByIdOnly(itemId);
  }
}
