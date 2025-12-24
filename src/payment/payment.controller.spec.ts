import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: Partial<Record<keyof PaymentService, jest.Mock>>;

  beforeEach(async () => {
    paymentService = {
      placePayment: jest.fn(),
      processNotification: jest.fn(),
      getAllPayments: jest.fn(),
      getPaymentById: jest.fn(),
      updatePaymentDetails: jest.fn(),
      deletePayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: paymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call placePayment and return result', async () => {
      const dto: CreatePaymentDto = {
        rental_id: 1,
        amount: 100,
        currency: 'LKR',
        payment_method: 'PAYHERE',
      };
      paymentService.placePayment!.mockResolvedValue('<html></html>');

      const result = await controller.create(dto);

      expect(paymentService.placePayment).toHaveBeenCalledWith(dto);
      expect(result).toBe('<html></html>');
    });
  });

  describe('notify', () => {
    it('should call processNotification and return "OK"', async () => {
      const data = { some: 'data' };
      paymentService.processNotification!.mockResolvedValue(undefined);

      const result = await controller.notify(data);

      expect(paymentService.processNotification).toHaveBeenCalledWith(data);
      expect(result).toBe('OK');
    });
  });

  describe('success', () => {
    it('should return a success message', () => {
      expect(controller.success()).toBe(
        'Payment Successful! You can close this window.',
      );
    });
  });

  describe('cancel', () => {
    it('should return a cancel message', () => {
      expect(controller.cancel()).toBe(
        'Payment Canceled. You can close this window.',
      );
    });
  });

  describe('findAll', () => {
    it('should return all payments', async () => {
      const payments = [{ payment_id: '1' }];
      paymentService.getAllPayments!.mockResolvedValue(payments as any);

      const result = await controller.findAll();

      expect(result).toEqual(payments);
    });
  });

  describe('findOne', () => {
    it('should return a payment', async () => {
      const payment = { payment_id: '1' };
      paymentService.getPaymentById!.mockResolvedValue(payment as any);

      const result = await controller.findOne('1');

      expect(paymentService.getPaymentById).toHaveBeenCalledWith('1');
      expect(result).toEqual(payment);
    });
  });

  describe('update', () => {
    it('should update payment', async () => {
      const dto: UpdatePaymentDto = { status: 'SUCCESS' };
      const payment = { payment_id: '1', status: 'SUCCESS' };
      paymentService.updatePaymentDetails!.mockResolvedValue(payment as any);

      const result = await controller.update('1', dto);

      expect(paymentService.updatePaymentDetails).toHaveBeenCalledWith(
        '1',
        dto,
      );
      expect(result).toEqual(payment);
    });
  });

  describe('remove', () => {
    it('should delete payment', async () => {
      paymentService.deletePayment!.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(paymentService.deletePayment).toHaveBeenCalledWith('1');
    });
  });
});
