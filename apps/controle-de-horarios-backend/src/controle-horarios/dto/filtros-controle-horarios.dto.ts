import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FiltrosControleHorariosDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  setorPrincipal?: string; // "GAMA", "SANTA MARIA", "PARANOÁ", "SÃO SEBASTIÃO"

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  codigoLinha?: string; // "780", "163"

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  codServicoNumero?: string; // "01", "12"

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim()?.toUpperCase())
  sentidoTexto?: string; // "IDA", "VOLTA", "CIRCULAR"

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  horarioInicio?: string; // "06:00"

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  horarioFim?: string; // "22:00"

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  nomeMotorista?: string; // Busca parcial no nome

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  localOrigem?: string; // Busca parcial no local

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  buscaTexto?: string; // Busca geral em múltiplos campos

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(500)
  limite?: number = 100;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pagina?: number = 0;
}