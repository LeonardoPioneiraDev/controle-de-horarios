import { IsEmail, IsString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/common/enums';

export class RegisterDto {
  @ApiProperty({ 
    example: 'joao.silva@example.com',
    description: 'E-mail do usuário'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'João',
    description: 'Primeiro nome do usuário'
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ 
    example: 'Silva',
    description: 'Sobrenome do usuário'
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ 
    enum: UserRole,
    example: UserRole.OPERADOR,
    description: 'Cargo/função do usuário',
    default: UserRole.OPERADOR
  })
  @IsEnum(UserRole)
  role: UserRole = UserRole.OPERADOR;

  @ApiProperty({ 
    example: 'MinhaSenh@123',
    description: 'Senha do usuário (mínimo 8 caracteres)'
  })
  @IsString()
  @MinLength(8)
  password: string;
}

