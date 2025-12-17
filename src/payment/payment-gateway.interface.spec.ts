import { PaymentGatewayInterface } from './payment-gateway.interface';

describe('PaymentGatewayInterface', () => {
  it('should be defined', () => {
    expect(new PaymentGatewayInterface()).toBeDefined();
  });
});
