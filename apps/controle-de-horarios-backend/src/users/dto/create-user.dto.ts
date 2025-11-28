import { IsEmail, IsString, IsEnum, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/common/enums';

export class CreateUserDto {
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
    example: UserRole.OPERADOR,
    description: 'Cargo/função do usuário'
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    example: false,
    description: 'Se verdadeiro, permite login automático para diretores',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  autoLoginDirector?: boolean;
}

