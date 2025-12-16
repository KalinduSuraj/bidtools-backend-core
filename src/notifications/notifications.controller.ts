import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './entities/notification.entity';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto): Promise<Notification> {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  @Get()
  async findAll(): Promise<Notification[]> {
    return this.notificationsService.getAllNotification();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Notification> {
    return this.notificationsService.getNotificationById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    return this.notificationsService.updateNotification(id, updateNotificationDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<string> {
    return this.notificationsService.deleteNotification(id);
  }
}