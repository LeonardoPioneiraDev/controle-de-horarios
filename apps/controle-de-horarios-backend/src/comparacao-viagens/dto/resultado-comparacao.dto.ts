// src/comparacao-viagens/dto/resultado-comparacao.dto.ts
export class ResultadoComparacaoDto {
  totalComparacoes: number;
  compativeis: number;
  divergentes: number;
  apenasTransdata: number;
  apenasGlobus: number;
  horarioDivergente: number;
  percentualCompatibilidade: number;
  linhasAnalisadas: number;
  tempoProcessamento: string;
}