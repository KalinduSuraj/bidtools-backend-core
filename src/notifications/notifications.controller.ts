import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateUserNotificationDto } from './dto/create-user-notification.dto';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  async create(@Body() dto: CreateUserNotificationDto) {
    return this.notificationsService.createUserNotification(dto);
  }

  // Place the unread-count route before the generic user route to avoid route conflicts
  @Get(':userId/unread-count')
  async getUnreadCount(@Param('userId') userId: string) {
    return this.notificationsService.getUnreadCountForUser(userId);
  }

  @Get(':userId')
  async getByUser(@Param('userId') userId: string) {
    return this.notificationsService.getNotificationsByUser(userId);
  }

  @Patch(':userId/:sk/read')
  async markAsRead(@Param('userId') userId: string, @Param('sk') sk: string) {
    await this.notificationsService.markNotificationAsRead(userId, sk);
    return { success: true };
  }
}
