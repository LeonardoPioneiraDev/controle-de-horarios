import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, Index } from 'typeorm';

@Entity('bco_alteracoes_itens')
@Unique('ux_bco_itens_data_idbco', ['dataReferencia', 'idbco'])
@Index(['dataReferencia', 'alterada'])
export class BcoAlteracoesItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'data_referencia', type: 'date' })
  dataReferencia!: Date;

  @Column({ name: 'idbco', type: 'integer' })
  idbco!: number;

  @Column({ name: 'documento', type: 'varchar', length: 50 })
  documento!: string;

  @Column({ name: 'log_alteracao', type: 'varchar', length: 255, nullable: true })
  logAlteracao!: string | null;

  @Column({ name: 'data_bco', type: 'date' })
  dataBco!: Date;

  @Column({ name: 'data_digitacao', type: 'date', nullable: true })
  dataDigitacao!: Date | null;

  @Column({ name: 'digitador', type: 'varchar', length: 100, nullable: true })
  digitador!: string | null;

  @Column({ name: 'prefixo_veic', type: 'varchar', length: 20, nullable: true })
  prefixoVeic!: string | null;

  @Column({ name: 'alterada', type: 'boolean', default: false })
  alterada!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

