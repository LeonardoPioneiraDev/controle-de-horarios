import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'ch_notifications' })
export class ChNotification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @Column({ type: 'date' })
  data_referencia!: Date;

  @Column({ type: 'text', nullable: true })
  codigo_linha!: string | null;

  @Column({ type: 'text', nullable: true })
  sentido_texto!: string | null; // IDA | VOLTA | CIRCULAR

  @Column({ type: 'text', nullable: true })
  cod_servico_numero!: string | null;

  @Column({ type: 'text', nullable: true })
  setor_principal_linha!: string | null;

  @Column({ type: 'text', nullable: true })
  local_origem_viagem!: string | null;

  @Column({ type: 'text', nullable: true })
  local_destino_linha!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  hor_saida!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  hor_saida_ajustada!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  hor_chegada!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  hor_chegada_ajustada!: Date | null;

  @Column({ type: 'boolean', default: false })
  de_acordo!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  de_acordo_em!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  controle_horario_id!: string | null;

  @Column({ type: 'text', nullable: true })
  cracha_motorista!: string | null;

  @Column({ type: 'text', nullable: true })
  nome_motorista!: string | null;

  @Column({ type: 'text', nullable: true })
  prefixo_veiculo!: string | null;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;
}

