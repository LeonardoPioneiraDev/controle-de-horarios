// src/viagens-globus/entities/viagem-globus.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('viagens_globus')
@Index(['dataViagem', 'codigoLinha'], { unique: false })
@Index(['dataViagem', 'setorPrincipal'], { unique: false })
@Index(['dataViagem'], { unique: false })
export class ViagemGlobus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ✅ INFORMAÇÕES DA LINHA E SETOR
  @Column({ name: 'setor_principal_linha', type: 'varchar', length: 50 })
  setorPrincipal: string;

  @Column({ name: 'cod_local_terminal_sec', type: 'integer' })
  codLocalTerminalSec: number;

  @Column({ name: 'codigo_linha', type: 'varchar', length: 20 })
  codigoLinha: string;

  @Column({ name: 'nome_linha', type: 'varchar', length: 200 })
  nomeLinha: string;

  @Column({ name: 'cod_destino_linha', type: 'integer', nullable: true })
  codDestinoLinha: number;

  @Column({ name: 'local_destino_linha', type: 'varchar', length: 100, nullable: true })
  localDestinoLinha: string;

  // ✅ INFORMAÇÕES DA VIAGEM/HORÁRIO
  @Column({ name: 'flg_sentido', type: 'varchar', length: 1 })
  flgSentido: string;

  @Column({ name: 'data_viagem', type: 'date' })
  dataViagem: Date;

  @Column({ name: 'desc_tipo_dia', type: 'varchar', length: 20, nullable: true })
  descTipoDia: string;

  @Column({ name: 'hor_saida', type: 'timestamp', nullable: true })
  horSaida: Date;

  @Column({ name: 'hor_chegada', type: 'timestamp', nullable: true })
  horChegada: Date;

  // ✅ HORÁRIOS FORMATADOS (APENAS HORA)
  @Column({ name: 'hor_saida_time', type: 'varchar', length: 8, nullable: true })
  horSaidaTime: string;

  @Column({ name: 'hor_chegada_time', type: 'varchar', length: 8, nullable: true })
  horChegadaTime: string;

  // ✅ LOCAL DE ORIGEM DA VIAGEM
  @Column({ name: 'cod_origem_viagem', type: 'integer', nullable: true })
  codOrigemViagem: number;

  @Column({ name: 'local_origem_viagem', type: 'varchar', length: 100, nullable: true })
  localOrigemViagem: string;

  // ✅ INFORMAÇÕES DA ATIVIDADE
  @Column({ name: 'cod_atividade', type: 'integer', nullable: true })
  codAtividade: number;

  @Column({ name: 'nome_atividade', type: 'varchar', length: 50, nullable: true })
  nomeAtividade: string;

  @Column({ name: 'flg_tipo', type: 'varchar', length: 1, nullable: true })
  flgTipo: string;

  // ✅ INFORMAÇÕES DO SERVIÇO
  @Column({ name: 'cod_servico_completo', type: 'varchar', length: 50, nullable: true })
  codServicoCompleto: string;

  @Column({ name: 'cod_servico_numero', type: 'varchar', length: 20, nullable: true })
  codServicoNumero: string;

  // ✅ INFORMAÇÕES DA TRIPULAÇÃO
  @Column({ name: 'cod_motorista', type: 'integer', nullable: true })
  codMotorista: number;

  @Column({ name: 'nome_motorista', type: 'varchar', length: 100, nullable: true })
  nomeMotorista: string;

  @Column({ name: 'cod_cobrador', type: 'integer', nullable: true })
  codCobrador: number;

  @Column({ name: 'nome_cobrador', type: 'varchar', length: 100, nullable: true })
  nomeCobrador: string;

  @Column({ name: 'cracha_motorista', type: 'varchar', length: 20, nullable: true })
  crachaMotorista: string;

  @Column({ name: 'chapafunc_motorista', type: 'varchar', length: 20, nullable: true })
  chapaFuncMotorista: string;

  @Column({ name: 'cracha_cobrador', type: 'varchar', length: 20, nullable: true })
  crachaCobrador: string;

  @Column({ name: 'chapafunc_cobrador', type: 'varchar', length: 20, nullable: true })
  chapaFuncCobrador: string;

  // ✅ INFORMAÇÃO ANALÍTICA
  @Column({ name: 'total_horarios', type: 'integer', default: 0 })
  totalHorarios: number;

  // ✅ CAMPOS DE CONTROLE
  @Column({ name: 'duracao_minutos', type: 'integer', nullable: true })
  duracaoMinutos: number;

  @Column({ name: 'data_referencia', type: 'varchar', length: 10 })
  dataReferencia: string; // YYYY-MM-DD

  @Column({ name: 'hash_dados', type: 'varchar', length: 64, unique: true })
  hashDados: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ✅ CAMPOS ADICIONAIS PARA ANÁLISE
  @Column({ name: 'sentido_texto', type: 'varchar', length: 20, nullable: true })
  sentidoTexto: string; // IDA/VOLTA baseado no flg_sentido

  @Column({ name: 'periodo_do_dia', type: 'varchar', length: 20, nullable: true })
  periodoDoDia: string; // MANHÃ/TARDE/NOITE/MADRUGADA

  @Column({ name: 'tem_cobrador', type: 'boolean', default: false })
  temCobrador: boolean;

  @Column({ name: 'origem_dados', type: 'varchar', length: 20, default: 'ORACLE_GLOBUS' })
  origemDados: string;

  @Column({ name: 'is_ativo', type: 'boolean', default: true })
  isAtivo: boolean;
}