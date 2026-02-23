import { Injectable, NotFoundException } from '@nestjs/common';
import { RentalRepository } from './rental.repository';
import { CreateRentalDto } from './dto/create-rental.dto';
import { Rental } from './entities/rental.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class RentalService {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async createRental(dto: CreateRentalDto): Promise<Rental> {
    const rentalId = uuid();
    const rental: Rental = {
      PK: `RENTAL#${rentalId}`,
      SK: 'METADATA',
      GSI3PK: `CONTRACTOR#${dto.contractor_id}`,
      GSI3SK: `RENTAL#${rentalId}`,
      GSI4PK: `SUPPLIER#${dto.supplier_id}`,
      GSI4SK: `RENTAL#${rentalId}`,
      rental_id: rentalId,
      job_id: dto.job_id,
      contractor_id: dto.contractor_id,
      supplier_id: dto.supplier_id,
      bid_id: dto.bid_id,
      start_date: dto.start_date,
      end_date: dto.end_date,
      total_amount: dto.total_amount,
      status: dto.status,
      payment_status: dto.payment_status,
    };
    await this.rentalRepository.saveRental(rental);
    return rental;
  }

  async getRentalsByContractor(contractorId: string): Promise<Rental[]> {
    return this.rentalRepository.getRentalsByContractor(contractorId);
  }

  async getRentalsBySupplier(supplierId: string): Promise<Rental[]> {
    return this.rentalRepository.getRentalsBySupplier(supplierId);
  }

  async getRentalById(rentalId: string): Promise<Rental> {
    const rental = await this.rentalRepository.getRentalById(rentalId);
    if (!rental) throw new NotFoundException('Rental not found');
    return rental;
  }
}
