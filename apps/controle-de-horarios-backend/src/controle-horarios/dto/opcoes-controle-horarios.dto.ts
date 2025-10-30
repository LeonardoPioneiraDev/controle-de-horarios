// src/modules/controle-horarios/dto/opcoes-controle-horarios.dto.ts

export interface OpcoesControleHorariosDto {
  setores: string[];
  linhas: { codigo: string; nome: string }[];
  servicos: string[];
  sentidos: string[];
  motoristas: { cracha: string; nome: string }[];
  locaisOrigem: string[];
  locaisDestino: string[];
}