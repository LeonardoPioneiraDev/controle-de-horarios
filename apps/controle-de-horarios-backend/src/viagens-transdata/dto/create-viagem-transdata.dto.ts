// src/viagens-transdata/dto/create-viagem-transdata.dto.ts

import { IsOptional, IsString, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateViagemTransdataDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  SentidoText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  InicioPrevistoText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  InicioRealizadoText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  FimPrevistoText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  FimRealizadoText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  PrefixoPrevisto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  PrefixoRealizado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  NomePI?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  NomePF?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  Servico?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  Trajeto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  NomeMotorista?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  MatriculaMotorista?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  NomeCobrador?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  MatriculaCobrador?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  IdLinha?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  NomeLinha?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  InicioPrevisto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  InicioRealizado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  StatusInicio?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  FimPrevisto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  FimRealizado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  StatusFim?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  Sentido?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  Viagem?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  PontosCumpridosPercentual?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  PontoFinal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataReferencia?: string;
}