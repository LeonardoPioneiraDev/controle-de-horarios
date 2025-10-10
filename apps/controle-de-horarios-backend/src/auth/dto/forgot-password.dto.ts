import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'usuario@vpioneira.com.br',
    description: 'E-mail do usuário para recuperação de senha',
  })
  @IsEmail({}, { message: 'E-mail deve ter um formato válido' })
  email: string;
}