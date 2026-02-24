import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification } from './entities/notification.entity';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    createNotification: jest.fn(),
    getAllNotification: jest.fn(),
    getNotificationById: jest.fn(),
    updateNotification: jest.fn(),
    deleteNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const dto: CreateNotificationDto = {
        message: 'Test message',
        targetEmail: 'test@example.com',
      };
      const result: Notification = {
        notification_id: '1',
        user_id: 'user_001',
        is_read: false,
        created_at: new Date().toISOString(),
        message: 'Test message',
      } as any;

      mockNotificationsService.createNotification.mockResolvedValue(result);

      expect(await controller.create(dto)).toBe(result);
      expect(service.createNotification).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all notifications', async () => {
      const result: Notification[] = [
        {
          notification_id: '1',
          user_id: 'user_001',
          is_read: false,
          created_at: new Date().toISOString(),
          message: 'Test message',
        } as any,
      ];

      mockNotificationsService.getAllNotification.mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
      expect(service.getAllNotification).toHaveBeenCalled();
    });

    it('should return a single notification by id', async () => {
      const result: Notification = {
        notification_id: '1',
        user_id: 'user_001',
        is_read: false,
        created_at: new Date().toISOString(),
        message: 'Test message',
      } as any;

      mockNotificationsService.getNotificationById.mockResolvedValue(result);

      expect(await controller.findAll('1')).toBe(result);
      expect(service.getNotificationById).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a notification', async () => {
      const result: Notification = {
        notification_id: '1',
        user_id: 'user_001',
        is_read: true,
        created_at: new Date().toISOString(),
        message: 'Test message',
      } as any;

      mockNotificationsService.updateNotification.mockResolvedValue(result);

      expect(await controller.update('1')).toBe(result);
      expect(service.updateNotification).toHaveBeenCalledWith('1');
    });
  });

  describe('remove', () => {
    it('should remove a notification', async () => {
      const result = 'Notification Removed';
      mockNotificationsService.deleteNotification.mockResolvedValue(result);

      expect(await controller.remove('1')).toBe(result);
      expect(service.deleteNotification).toHaveBeenCalledWith('1');
    });
  });
});
