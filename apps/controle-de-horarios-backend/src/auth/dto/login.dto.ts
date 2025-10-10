import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'leonardolopes@vpioneira.com.br',
    description: 'E-mail institucional do usuário',
  })
  @IsEmail({}, { message: 'E-mail deve ter um formato válido' })
  email: string;

  @ApiProperty({
    example: 'admin123',
    description: 'Senha do usuário',
    minLength: 6,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;
}