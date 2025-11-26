// src/viagens-transdata/entities/viagem-transdata.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { createHash } from 'crypto';

@Entity({ name: 'viagens_transdata' })
@Index(['dataReferencia', 'isAtivo'])
@Index(['IdLinha', 'Servico', 'Viagem', 'dataReferencia'], { unique: true })
@Index(['codigoLinha', 'dataReferencia']) // ✅ CORRIGIDO: Remover aspas duplas
@Index(['SentidoText', 'dataReferencia'])
@Index(['statusCumprimento', 'dataReferencia'])
@Index(['hashDados'])
export class ViagemTransdata {
  @PrimaryGeneratedColumn()
  id: number;

  // ✅ CAMPO HASH PARA UPSERT INTELIGENTE
  @Column({ type: 'varchar', length: 32, nullable: true, name: 'hashDados' })
  hashDados: string;

  // ✅ CAMPOS OBRIGATÓRIOS DE CONTROLE
  @Column({ type: 'date', name: 'dataReferencia' })
  dataReferencia: string;

  @Column({ type: 'boolean', default: true, name: 'isAtivo' })
  isAtivo: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'ultimaSincronizacao' })
  ultimaSincronizacao: Date;

  // ✅ CAMPOS EXTRAÍDOS/CALCULADOS
  @Column({ type: 'varchar', length: 10, nullable: true, name: 'codigoLinha' }) // ✅ CORRIGIDO: Especificar nome da coluna
  codigoLinha: string; // Primeiros 6 dígitos da linha

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'PENDENTE', name: 'statusCumprimento' })
  statusCumprimento: string;

  // ✅ CAMPOS ORIGINAIS DA API TRANSDATA
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'SentidoText' })
  SentidoText: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'InicioPrevistoText' })
  InicioPrevistoText: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'InicioRealizadoText' })
  InicioRealizadoText: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'FimPrevistoText' })
  FimPrevistoText: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'FimRealizadoText' })
  FimRealizadoText: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'PrefixoPrevisto' })
  PrefixoPrevisto: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'PrefixoRealizado' })
  PrefixoRealizado: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'NomePI' })
  NomePI: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'NomePF' })
  NomePF: string;

  @Column({ type: 'int', nullable: true, name: 'Servico' })
  Servico: number;

  @Column({ type: 'text', nullable: true, name: 'Trajeto' })
  Trajeto: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'NomeMotorista' })
  NomeMotorista: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'MatriculaMotorista' })
  MatriculaMotorista: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'NomeCobrador' })
  NomeCobrador: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'MatriculaCobrador' })
  MatriculaCobrador: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'ParadasLbl' })
  ParadasLbl: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'Link1Text' })
  Link1Text: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'HistoricoLbl' })
  HistoricoLbl: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'Link2Text' })
  Link2Text: string;

  @Column({ type: 'int', nullable: true, name: 'ParcialmenteCumprida' })
  ParcialmenteCumprida: number;

  @Column({ type: 'int', nullable: true, name: 'NaoCumprida' })
  NaoCumprida: number;

  @Column({ type: 'int', nullable: true, name: 'ForadoHorarioInicio' })
  ForadoHorarioInicio: number;

  @Column({ type: 'int', nullable: true, name: 'ForadoHorarioFim' })
  ForadoHorarioFim: number;

  @Column({ type: 'int', nullable: true, name: 'AtrasadoInicio' })
  AtrasadoInicio: number;

  @Column({ type: 'int', nullable: true, name: 'AtrasadoFim' })
  AtrasadoFim: number;

  @Column({ type: 'int', nullable: true, name: 'AdiantadoInicio' })
  AdiantadoInicio: number;

  @Column({ type: 'int', nullable: true, name: 'AdiantadoFim' })
  AdiantadoFim: number;

  @Column({ type: 'int', nullable: true, name: 'NaoCumpridoInicio' })
  NaoCumpridoInicio: number;

  @Column({ type: 'int', nullable: true, name: 'NaoCumpridoFim' })
  NaoCumpridoFim: number;

  @Column({ type: 'int', nullable: true, name: 'IdLinha' })
  IdLinha: number;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'NomeLinha' })
  NomeLinha: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'InicioPrevisto' })
  InicioPrevisto: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'InicioRealizado' })
  InicioRealizado: string;

  @Column({ type: 'int', nullable: true, name: 'StatusInicio' })
  StatusInicio: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'FimPrevisto' })
  FimPrevisto: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'FimRealizado' })
  FimRealizado: string;

  @Column({ type: 'int', nullable: true, name: 'StatusFim' })
  StatusFim: number;

  @Column({ type: 'boolean', nullable: true, name: 'Sentido' })
  Sentido: boolean;

  @Column({ type: 'int', nullable: true, name: 'Viagem' })
  Viagem: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'PontosCumpridosPercentual' })
  PontosCumpridosPercentual: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'PontoFinal' })
  PontoFinal: string;

  @Column({ type: 'int', nullable: true, name: 'ValidouPontosCumpridos' })
  ValidouPontosCumpridos: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'KMProgramado' })
  KMProgramado: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'KMRodado' })
  KMRodado: string;

  @Column({ type: 'int', nullable: true, name: 'Consolidad' })
  Consolidad: number;

  // ✅ HOOKS PARA CALCULAR HASH E CÓDIGO DA LINHA
  @BeforeInsert()
  @BeforeUpdate()
  processarDados() {
    this.hashDados = this.gerarHashDados();
    this.codigoLinha = this.extrairCodigoLinha();
    this.statusCumprimento = this.calcularStatusCumprimento();
  }

  /**
   * ✅ GERAR HASH MD5 DOS DADOS PRINCIPAIS
   */
  private gerarHashDados(): string {
    const dadosParaHash = [
      this.IdLinha?.toString() || '',
      this.Servico?.toString() || '',
      this.Viagem?.toString() || '',
      this.InicioRealizado || '',
      this.FimRealizado || '',
      this.PrefixoRealizado || '',
      this.NomeMotorista || '',
      this.dataReferencia || ''
    ].join('|');

    return createHash('md5').update(dadosParaHash).digest('hex');
  }

  /**
   * ✅ EXTRAIR CÓDIGO DA LINHA (6 primeiros dígitos)
   */
  private extrairCodigoLinha(): string {
    if (!this.NomeLinha) return null;
    
    // Remove pontos, traços e espaços, pega só números
    const numerosSo = this.NomeLinha.replace(/[.\-\s]/g, '');
    return numerosSo.substring(0, 6);
  }

  /**
   * ✅ CALCULAR STATUS DE CUMPRIMENTO
   */
  private calcularStatusCumprimento(): string {
    if (this.NaoCumprida === 1) return 'NAO_CUMPRIDA';
    if (this.ParcialmenteCumprida === 1) return 'PARCIALMENTE_CUMPRIDA';
    if (this.InicioRealizado && this.FimRealizado) return 'CUMPRIDA';
    return 'PENDENTE';
  }
}