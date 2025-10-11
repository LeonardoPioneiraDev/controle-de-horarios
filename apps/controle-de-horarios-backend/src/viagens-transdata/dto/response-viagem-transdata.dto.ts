// src/viagens-transdata/dto/response-viagem-transdata.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class ViagemTransdataResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  codigoLinha: string;

  @ApiProperty()
  NomeLinha: string;

  @ApiProperty()
  Servico: number;

  @ApiProperty()
  SentidoText: string;

  @ApiProperty()
  Trajeto: string;

  @ApiProperty()
  InicioPrevistoText: string;

  @ApiProperty()
  InicioRealizadoText: string;

  @ApiProperty()
  FimPrevistoText: string;

  @ApiProperty()
  FimRealizadoText: string;

  @ApiProperty()
  PrefixoRealizado: string;

  @ApiProperty()
  NomeMotorista: string;

  @ApiProperty()
  NomeCobrador: string;

  @ApiProperty()
  statusCumprimento: string;

  @ApiProperty()
  PontoFinal: string;

  @ApiProperty()
  PontosCumpridosPercentual: string;

  @ApiProperty()
  dataReferencia: string;
}

export class ResponsePaginadaDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}