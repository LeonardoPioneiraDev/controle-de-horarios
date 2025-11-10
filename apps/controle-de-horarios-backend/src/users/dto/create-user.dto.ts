import { IsEmail, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/common/enums';

export class CreateUserDto {
  @ApiProperty({ 
    example: 'joao.silva@vpioneira.com.br',
    description: 'E-mail do usuário (deve ser @vpioneira.com.br)'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'João',
    description: 'Primeiro nome do usuário'
  })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ 
    example: 'Silva',
    description: 'Sobrenome do usuário'
  })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ 
    enum: UserRole,
    example: UserRole.FUNCIONARIO,
    description: 'Cargo/função do usuário'
  })
  @IsEnum(UserRole)
  role: UserRole;
}