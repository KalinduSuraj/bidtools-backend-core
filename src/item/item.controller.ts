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
} from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';

@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createItemDto: CreateItemDto): Promise<Item> {
    return this.itemService.createItem(createItemDto);
  }

  @Get()
  async findAll(@Query('status') status?: string): Promise<Item[]> {
    if (status) {
      return this.itemService.getItemsByStatus(status);
    }
    return this.itemService.getAllItems();
  }

  @Get('supplier/:supplierId')
  async findBySupplier(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
  ): Promise<Item[]> {
    return this.itemService.getItemsBySupplier(supplierId);
  }

  @Get('supplier/:supplierId/:itemId')
  async findOne(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<Item> {
    return this.itemService.getItemById(supplierId, itemId);
  }

  @Put('supplier/:supplierId/:itemId')
  async update(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<Item> {
    return this.itemService.updateItem(supplierId, itemId, updateItemDto);
  }

  @Delete('supplier/:supplierId/:itemId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<string> {
    return this.itemService.deleteItem(supplierId, itemId);
  }
}
