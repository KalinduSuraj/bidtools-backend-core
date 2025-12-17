import { Injectable } from "@nestjs/common";

@Injectable()
export class GatewayProvider {
    async processCharge(amount:number,token:string){
        return { success: true, transactionId: 'ch_12345abc' };
    }
}
