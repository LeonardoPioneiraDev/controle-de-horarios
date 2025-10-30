// src/modules/controle-horarios/dto/filtros-controle-horarios.dto.ts

import { IsOptional, IsString, IsNumber, Min, Max, IsEnum, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CombinacaoComparacao } from '../../comparacao-viagens/utils/trip-comparator.util';

export class FiltrosControleHorariosDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  setorPrincipal?: string;

  // ✅ CORRIGIDO: Aceitar tanto string quanto array
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value.trim()];
    }
    if (Array.isArray(value)) {
      return value.map(v => v?.toString().trim()).filter(Boolean);
    }
    return value;
  })
  codigoLinha?: string[];

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  codServicoNumero?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim()?.toUpperCase())
  sentidoTexto?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  horarioInicio?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  horarioFim?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  nomeMotorista?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  localOrigem?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  localDestino?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  codAtividade?: number;

  @IsOptional()
  @Type(() => Boolean)
  editadoPorUsuario?: boolean;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  crachaMotorista?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  buscaTexto?: string;

  @IsOptional()
  @IsEnum(CombinacaoComparacao)
  @Type(() => Number)
  combinacaoComparacao?: CombinacaoComparacao;

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