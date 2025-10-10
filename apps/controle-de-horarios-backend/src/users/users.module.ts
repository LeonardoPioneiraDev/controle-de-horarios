import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { EmailModule } from '../email/email.module'; // ✅ IMPORTAR DO CAMINHO CORRETO

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    EmailModule, // ✅ IMPORTAR EmailModule, NÃO EmailService
  ],
  controllers: [UsersController],
  providers: [UsersService], // ✅ REMOVER EmailService DAQUI
  exports: [UsersService],
})
export class UsersModule {}