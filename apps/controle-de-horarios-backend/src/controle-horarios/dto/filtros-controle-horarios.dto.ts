// src/modules/controle-horarios/dto/filtros-controle-horarios.dto.ts

import { IsOptional, IsString, IsNumber, Min, Max, IsEnum, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FiltrosControleHorariosDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  setorPrincipal?: string; // Corresponds to setorPrincipalLinha

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
  sentidoTexto?: string; // Corresponds to flgSentido

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  horarioInicio?: string; // Corresponds to horaSaida

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  horarioFim?: string; // Corresponds to horaChegada

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  codMotorista?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  nomeMotorista?: string; // Corresponds to nomeMotoristaGlobus or nomeMotoristaEditado

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  localOrigem?: string; // Corresponds to localOrigemViagem

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  localDestino?: string; // Corresponds to localDestinoLinha

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  codAtividade?: number;

  @IsOptional()
  @Type(() => Boolean)
  editadoPorUsuario?: boolean;

  @ApiProperty({ description: 'Filtrar viagens editadas pelo usuário atual', required: false })
  @IsOptional()
  @Type(() => Boolean)
  meusEditados?: boolean;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  crachaMotorista?: string; // Corresponds to crachaMotoristaGlobus or crachaMotoristaEditado

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  nomeCobrador?: string; // Corresponds to nomeCobradorGlobus or nomeCobradorEditado

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  crachaCobrador?: string; // Corresponds to crachaCobradorGlobus or crachaCobradorEditado

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  buscaTexto?: string;

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

  @IsOptional()
  @IsString()
  ordenarPor?: string = 'horaSaida'; // Campo para ordenação

  @IsOptional()
  @IsString()
  @IsEnum(['ASC', 'DESC'])
  ordem?: 'ASC' | 'DESC' = 'ASC'; // Ordem da ordenação
}