import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('bco_alteracoes_resumo')
@Unique(['dataReferencia'])
export class BcoAlteracoesResumo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'data_referencia', type: 'date' })
  dataReferencia!: Date;

  @Column({ name: 'total_documentos', type: 'integer' })
  totalDocumentos!: number;

  @Column({ name: 'total_alteradas', type: 'integer' })
  totalAlteradas!: number;

  @Column({ name: 'total_pendentes', type: 'integer' })
  totalPendentes!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

