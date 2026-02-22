import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) { }

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const newUser: User = {
            user_id: createUserDto.user_id,
            name: createUserDto.name,
            email: createUserDto.email,
            role: createUserDto.role,
            phone: createUserDto.phone,
            status: createUserDto.status || 'pending_verification',
            created_at: new Date().toISOString(),
        };

        await this.usersRepository.saveUser(newUser);
        return newUser;
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.getAllUsers();
    }

    async findOne(userId: string): Promise<User> {
        const user = await this.usersRepository.getUserById(userId);
        if (!user) {
            throw new NotFoundException(`User with ID "${userId}" not found`);
        }
        return user;
    }

    async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
        // Ensure the user exists first
        await this.findOne(userId);

        await this.usersRepository.updateUser(userId, updateUserDto);

        // Return the updated user
        return this.findOne(userId);
    }

    async remove(userId: string): Promise<void> {
        // Ensure the user exists first
        await this.findOne(userId);
        await this.usersRepository.deleteUser(userId);
    }
}
