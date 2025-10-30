import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SincronizarControleHorariosDto {
  @ApiProperty({
    description: 'Indica se os dados existentes para a data devem ser sobrescritos/excluídos antes da sincronização.',
    type: Boolean,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  overwrite?: boolean = false;
}
