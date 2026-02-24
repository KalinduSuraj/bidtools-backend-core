import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

import { Notification } from './entities/notification.entity';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  @Get()
  async findAll(
    @Query('id', new ParseUUIDPipe({ optional: true })) id?: string,
  ): Promise<Notification | Notification[]> {
    if (id) {
      return this.notificationsService.getNotificationById(id);
    }
    return this.notificationsService.getAllNotification();
  }

  @Put(':id')
  async update(@Param('id', ParseUUIDPipe) id: string): Promise<Notification> {
    return this.notificationsService.updateNotification(id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<string> {
    return this.notificationsService.deleteNotification(id);
  }
}

//notifications/users/{id} //!need to implement this endpoint
