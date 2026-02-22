import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesRepository } from './profiles.repository';
import { DynomodbModule } from '../common/dynomodb/dynomodb.module';

@Module({
  imports: [DynomodbModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfilesRepository],
  exports: [ProfilesService],
})
export class ProfilesModule { }
