import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

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

export class SalvarMultiplosControleHorariosDto {
  @IsString()
  dataReferencia: string;

  controles: SalvarControleHorariosDto[];
}