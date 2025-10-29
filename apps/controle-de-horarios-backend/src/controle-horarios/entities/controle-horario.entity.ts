import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('controle_horarios')
@Index(['dataReferencia', 'codigoLinha'])
@Index(['dataReferencia', 'viagemGlobusId'])
export class ControleHorario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Referência à viagem Globus
  @Column({ name: 'viagem_globus_id', length: 50 })
  @Index()
  viagemGlobusId: string;

  // Dados de contexto para facilitar consultas
  @Column({ name: 'data_referencia', length: 10 })
  dataReferencia: string; // YYYY-MM-DD

  // CAMPOS EDITÁVEIS PELO USUÁRIO
  @Column({ name: 'numero_carro', length: 50, nullable: true })
  numeroCarro: string;

  @Column({ name: 'informacao_recolhe', length: 200, nullable: true })
  informacaoRecolhe: string;

  @Column({ name: 'cracha_funcionario', length: 50, nullable: true })
  crachaFuncionario: string;

  @Column({ name: 'observacoes', length: 500, nullable: true })
  observacoes: string;

  // Auditoria
  @Column({ name: 'usuario_edicao', length: 500 }) // ✅ ATUALIZADO: 500
  usuarioEdicao: string;

  @Column({ name: 'usuario_email', length: 500, nullable: true }) // ✅ ATUALIZADO: 500
  usuarioEmail: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'is_ativo', type: 'boolean', default: true })
  isAtivo: boolean;
}