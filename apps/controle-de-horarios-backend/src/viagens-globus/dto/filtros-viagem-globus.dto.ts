// src/modules/viagens-globus/dto/filtros-viagem-globus.dto.ts
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, Min, Max, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

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

export enum OrdemOrdenacaoGlobus {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FiltrosViagemGlobusDto {
  @ApiPropertyOptional({ description: 'Data da viagem YYYY-MM-DD (ignorada se fornecida na rota)' })
  @IsOptional()
  @IsDateString()
  dataViagem?: string;

  @ApiPropertyOptional({ description: 'Códigos de setor (CSV ou array)', type: [Number] })
  @IsOptional()
  @Transform(({ value }) => Array.isArray(value) ? value.map(Number) : value?.split(',').map(Number))
  @Type(() => Number)
  setores?: number[];

  @ApiPropertyOptional({ description: 'Código da linha (busca parcial)' })
  @IsOptional()
  @IsString()
  codigoLinha?: string;

  @ApiPropertyOptional({ description: 'Nome da linha (busca parcial)' })
  @IsOptional()
  @IsString()
  nomeLinha?: string;

  @ApiPropertyOptional({ description: 'Sentido (I, V, C)', enum: SentidoGlobus })
  @IsOptional()
  @IsEnum(SentidoGlobus)
  sentido?: SentidoGlobus;

  @ApiPropertyOptional({ description: 'Setor principal (texto exato)' })
  @IsOptional()
  @IsString()
  setorPrincipal?: string;

  @ApiPropertyOptional({ description: 'Local de origem da viagem (busca parcial)' })
  @IsOptional()
  @IsString()
  localOrigemViagem?: string;

  @ApiPropertyOptional({ description: 'Número do serviço (busca parcial)' })
  @IsOptional()
  @IsString()
  codServicoNumero?: string;

  @ApiPropertyOptional({ description: 'Nome do motorista (busca parcial)' })
  @IsOptional()
  @IsString()
  nomeMotorista?: string;

  @ApiPropertyOptional({ description: 'Nome do cobrador (busca parcial)' })
  @IsOptional()
  @IsString()
  nomeCobrador?: string;

  @ApiPropertyOptional({ description: 'Código de destino da linha (igualdade)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  codDestinoLinha?: number;

  @ApiPropertyOptional({ description: 'Local de destino (busca parcial)' })
  @IsOptional()
  @IsString()
  localDestinoLinha?: string;

  @ApiPropertyOptional({ description: 'Tipo de dia (busca parcial: DIAS UTEIS, SABADO, DOMINGO)' })
  @IsOptional()
  @IsString()
  descTipoDia?: string;

  @ApiPropertyOptional({ description: 'Código da atividade (igualdade)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  codAtividade?: number;

  @ApiPropertyOptional({ description: 'Nome da atividade (busca parcial)' })
  @IsOptional()
  @IsString()
  nomeAtividade?: string;

  @ApiPropertyOptional({ description: 'Flag de tipo (R/S)' })
  @IsOptional()
  @IsString()
  flgTipo?: string;

  @ApiPropertyOptional({ description: 'Código do motorista no Globus' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  codMotoristaGlobus?: number;

  @ApiPropertyOptional({ description: 'Chapa do motorista (busca parcial)' })
  @IsOptional()
  @IsString()
  chapaFuncMotorista?: string;

  @ApiPropertyOptional({ description: 'Código do cobrador no Globus' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  codCobradorGlobus?: number;

  @ApiPropertyOptional({ description: 'Chapa do cobrador (busca parcial)' })
  @IsOptional()
  @IsString()
  chapaFuncCobrador?: string;

  @ApiPropertyOptional({ description: 'Prefixo do veículo (busca parcial)' })
  @IsOptional()
  @IsString()
  prefixoVeiculo?: string;

  // Novos filtros adicionais
  @ApiPropertyOptional({ description: 'Apenas viagens com cobrador', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  apenasComCobrador?: boolean = false;

  @ApiPropertyOptional({ description: 'Hora inicial (HH:MM) para filtrar por saída', example: '08:00' })
  @IsOptional()
  @IsString()
  horarioInicio?: string;

  @ApiPropertyOptional({ description: 'Hora final (HH:MM) para filtrar por chegada', example: '18:00' })
  @IsOptional()
  @IsString()
  horarioFim?: string;

  @ApiPropertyOptional({ description: 'Busca geral em múltiplos campos' })
  @IsOptional()
  @IsString()
  buscaTexto?: string;

  @ApiPropertyOptional({ description: 'Limite de resultados por página', default: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10000)
  limite?: number = 1000;

  @ApiPropertyOptional({ description: 'Número da página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Incluir estatísticas na resposta', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  incluirEstatisticas?: boolean = false;

  @ApiPropertyOptional({ description: 'Salvar dados localmente se não encontrados', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  salvarLocal?: boolean = true;

  @ApiPropertyOptional({ description: 'Campo para ordenar (whitelist)', example: 'horSaida' })
  @IsOptional()
  @IsString()
  ordenarPor?: string;

  @ApiPropertyOptional({ description: 'Ordem da ordenação', enum: OrdemOrdenacaoGlobus, example: 'ASC' })
  @IsOptional()
  @IsEnum(OrdemOrdenacaoGlobus)
  ordem?: OrdemOrdenacaoGlobus;
}
