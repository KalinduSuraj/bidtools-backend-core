import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RentalService } from './rental.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { Rental } from './entities/rental.entity';

@ApiTags('Rentals')
@Controller('rental')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Post()
  async create(@Body() dto: CreateRentalDto): Promise<Rental> {
    return this.rentalService.createRental(dto);
  }

  @Get('contractor')
  async getByContractor(
    @Query('contractorId') contractorId: string,
  ): Promise<Rental[]> {
    return this.rentalService.getRentalsByContractor(contractorId);
  }

  @Get('supplier')
  async getBySupplier(
    @Query('supplierId') supplierId: string,
  ): Promise<Rental[]> {
    return this.rentalService.getRentalsBySupplier(supplierId);
  }

  @Get(':rentalId')
  async getById(@Param('rentalId') rentalId: string): Promise<Rental> {
    return this.rentalService.getRentalById(rentalId);
  }
}
