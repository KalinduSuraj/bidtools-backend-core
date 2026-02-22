import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { DynomodbModule } from '../common/dynomodb/dynomodb.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [DynomodbModule, forwardRef(() => AuthModule)],
    controllers: [UsersController],
    providers: [UsersService, UsersRepository],
    exports: [UsersService],
})
export class UsersModule { }
