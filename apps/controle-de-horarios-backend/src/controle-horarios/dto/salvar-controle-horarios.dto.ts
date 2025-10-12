import { IsString, IsOptional, IsUUID, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SalvarControleHorariosDto {
  @IsUUID()
  viagemGlobusId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  numeroCarro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  informacaoRecolhe?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  crachaFuncionario?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  observacoes?: string;
}

// ✅ CORREÇÃO: DTO para salvamento múltiplo
export class SalvarMultiplosControleHorariosDto {
  @IsString()
  dataReferencia: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalvarControleHorariosDto)
  controles: SalvarControleHorariosDto[];
}