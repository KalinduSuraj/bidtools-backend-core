import { Module } from '@nestjs/common';
import { TestDbController } from './test-db.controller';
import { TestDbService } from './test-db.service';
import { DynomodbModule } from '../common/dynomodb/dynomodb.module';

@Module({
  imports: [DynomodbModule],
  controllers: [TestDbController],
  providers: [TestDbService],
})
export class TestDbModule {}
