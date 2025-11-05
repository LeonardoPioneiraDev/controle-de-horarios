import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'comparacao_viagens_historico' })
@Index(['dataReferencia'])
@Index(['createdAt'])
export class HistoricoComparacaoViagens {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_referencia', type: 'varchar', length: 10 })
  dataReferencia: string;

  @Column({ name: 'total_comparacoes', type: 'int', default: 0 })
  totalComparacoes: number;

  @Column({ name: 'compativeis', type: 'int', default: 0 })
  compativeis: number;

  @Column({ name: 'divergentes', type: 'int', default: 0 })
  divergentes: number;

  @Column({ name: 'apenas_transdata', type: 'int', default: 0 })
  apenasTransdata: number;

  @Column({ name: 'apenas_globus', type: 'int', default: 0 })
  apenasGlobus: number;

  @Column({ name: 'horario_divergente', type: 'int', default: 0 })
  horarioDivergente: number;

  @Column({ name: 'percentual_compatibilidade', type: 'numeric', precision: 5, scale: 2, default: 0 })
  percentualCompatibilidade: string; // manter como string para numeric do PG

  @Column({ name: 'linhas_analisadas', type: 'int', default: 0 })
  linhasAnalisadas: number;

  @Column({ name: 'tempo_processamento', type: 'varchar', length: 32 })
  tempoProcessamento: string;

  @Column({ name: 'duration_ms', type: 'int' })
  durationMs: number;

  @Column({ name: 'executed_by_user_id', type: 'uuid', nullable: true })
  executedByUserId: string | null;

  @Column({ name: 'executed_by_email', type: 'varchar', length: 255, nullable: true })
  executedByEmail: string | null;

  @Column({ name: 'counts_por_combinacao', type: 'jsonb', nullable: true })
  countsPorCombinacao: Record<string, number> | null;

  @Column({ name: 'total_transdata', type: 'int', nullable: true })
  totalTransdata: number | null;

  @Column({ name: 'total_globus', type: 'int', nullable: true })
  totalGlobus: number | null;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

