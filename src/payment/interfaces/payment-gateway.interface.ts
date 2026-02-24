export interface PaymentGatewayInterface {
  charge(amount: number, token: string): Promise<any>;
}
