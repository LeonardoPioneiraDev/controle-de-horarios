// src/modules/viagens-globus/dto/filtros-viagem-globus.dto.ts
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum SetorGlobus {
  SANTA_MARIA = 6000,
  GAMA = 7000,
  PARANOA = 8000,
  SAO_SEBASTIAO = 9000
}

export enum SentidoGlobus {
  IDA = 'I',
  VOLTA = 'V',
  CIRCULAR = 'C'
}

export class FiltrosViagemGlobusDto {
  @IsOptional()
  @IsDateString()
  dataViagem?: string;

  @IsOptional()
  @Transform(({ value }) => value?.split(',').map(Number))
  @Type(() => Number)
  setores?: number[];

  @IsOptional()
  @IsString()
  codigoLinha?: string;

  @IsOptional()
  @IsString()
  nomeLinha?: string;

  @IsOptional()
  @IsEnum(SentidoGlobus)
  sentido?: SentidoGlobus;

  @IsOptional()
  @IsString()
  setorPrincipal?: string;

  @IsOptional()
  @IsString()
  localOrigemViagem?: string;

  @IsOptional()
  @IsString()
  codServicoNumero?: string;

  @IsOptional()
  @IsString()
  nomeMotorista?: string;

  @IsOptional()
  @IsString()
  nomeCobrador?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10000)
  limite?: number = 1000;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  incluirEstatisticas?: boolean = false;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  salvarLocal?: boolean = true;
}