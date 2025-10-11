// src/viagens-transdata/entities/viagem-transdata.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { createHash } from 'crypto';

@Entity({ name: 'viagens_transdata' })
@Index(['dataReferencia', 'isAtivo'])
@Index(['IdLinha', 'Servico', 'Viagem', 'dataReferencia'], { unique: true })
@Index(['codigoLinha', 'dataReferencia'])
@Index(['SentidoText', 'dataReferencia'])
@Index(['statusCumprimento', 'dataReferencia'])
@Index(['hashDados'])
export class ViagemTransdata {
  @PrimaryGeneratedColumn()
  id: number;

  // ✅ CAMPO HASH PARA UPSERT INTELIGENTE
  @Column({ type: 'varchar', length: 32, nullable: true })
  hashDados: string;

  // ✅ CAMPOS OBRIGATÓRIOS DE CONTROLE
  @Column({ type: 'date' })
  dataReferencia: string;

  @Column({ type: 'boolean', default: true })
  isAtivo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  ultimaSincronizacao: Date;

  // ✅ CAMPOS EXTRAÍDOS/CALCULADOS
  @Column({ type: 'varchar', length: 10, nullable: true })
  codigoLinha: string; // Primeiros 6 dígitos da linha

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'PENDENTE' })
  statusCumprimento: string;

  // ✅ CAMPOS ORIGINAIS DA API TRANSDATA
  @Column({ type: 'varchar', length: 50, nullable: true })
  SentidoText: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  InicioPrevistoText: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  InicioRealizadoText: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  FimPrevistoText: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  FimRealizadoText: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  PrefixoPrevisto: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  PrefixoRealizado: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  NomePI: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  NomePF: string;

  @Column({ type: 'int', nullable: true })
  Servico: number;

  @Column({ type: 'text', nullable: true })
  Trajeto: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  NomeMotorista: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  MatriculaMotorista: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  NomeCobrador: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  MatriculaCobrador: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ParadasLbl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  Link1Text: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  HistoricoLbl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  Link2Text: string;

  @Column({ type: 'int', nullable: true })
  ParcialmenteCumprida: number;

  @Column({ type: 'int', nullable: true })
  NaoCumprida: number;

  @Column({ type: 'int', nullable: true })
  ForadoHorarioInicio: number;

  @Column({ type: 'int', nullable: true })
  ForadoHorarioFim: number;

  @Column({ type: 'int', nullable: true })
  AtrasadoInicio: number;

  @Column({ type: 'int', nullable: true })
  AtrasadoFim: number;

  @Column({ type: 'int', nullable: true })
  AdiantadoInicio: number;

  @Column({ type: 'int', nullable: true })
  AdiantadoFim: number;

  @Column({ type: 'int', nullable: true })
  NaoCumpridoInicio: number;

  @Column({ type: 'int', nullable: true })
  NaoCumpridoFim: number;

  @Column({ type: 'int', nullable: true })
  IdLinha: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  NomeLinha: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  InicioPrevisto: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  InicioRealizado: string;

  @Column({ type: 'int', nullable: true })
  StatusInicio: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  FimPrevisto: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  FimRealizado: string;

  @Column({ type: 'int', nullable: true })
  StatusFim: number;

  @Column({ type: 'boolean', nullable: true })
  Sentido: boolean;

  @Column({ type: 'int', nullable: true })
  Viagem: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  PontosCumpridosPercentual: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  PontoFinal: string;

  @Column({ type: 'int', nullable: true })
  ValidouPontosCumpridos: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  KMProgramado: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  KMRodado: string;

  @Column({ type: 'int', nullable: true })
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