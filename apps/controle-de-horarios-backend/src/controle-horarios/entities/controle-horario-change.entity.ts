import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ControleHorario } from './controle-horario.entity';

@Entity('controle_horario_changes')
@Index(['controle_horario_id', 'campo'])
@Index(['data_referencia'])
@Index(['alterado_por_email'])
export class ControleHorarioChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  controle_horario_id: string;

  @ManyToOne(() => ControleHorario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'controle_horario_id' })
  controleHorario: ControleHorario;

  @Column({ type: 'varchar', length: 100 })
  campo: string;

  @Column({ type: 'text', nullable: true })
  valor_anterior: string | null;

  @Column({ type: 'text', nullable: true })
  valor_novo: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  alterado_por_nome: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  alterado_por_email: string | null;

  @Column({ type: 'date', nullable: true })
  data_referencia: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}

