import { PaymentRepository } from './payment.repository';

describe('PaymentRepository', () => {
  it('should be defined', () => {
    expect(new PaymentRepository()).toBeDefined();
  });
});
