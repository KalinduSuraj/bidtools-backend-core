import { Module, forwardRef } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesRepository } from './profiles.repository';
import { DynomodbModule } from '../common/dynomodb/dynomodb.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DynomodbModule, forwardRef(() => AuthModule)],
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfilesRepository],
  exports: [ProfilesService],
})
export class ProfilesModule { }
