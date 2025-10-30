import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('controle_horarios')
@Index(['dataReferencia', 'viagemGlobusId']) // ✅ CORRIGIDO: Removido codigoLinha
@Index(['dataReferencia', 'isAtivo']) // ✅ ADICIONADO: Índice útil para consultas
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

  @Column({ name: 'informacao_recolhe', length: 300, nullable: true }) // ✅ CORRIGIDO: 300 como no banco
  informacaoRecolhe: string;

  @Column({ name: 'cracha_funcionario', length: 50, nullable: true })
  crachaFuncionario: string;

  @Column({ name: 'observacoes', type: 'text', nullable: true }) // ✅ CORRIGIDO: text como no banco
  observacoes: string;

  // Auditoria
  @Column({ name: 'usuario_edicao', length: 500, nullable: true }) // ✅ CORRIGIDO: nullable como no banco
  usuarioEdicao: string;

  @Column({ name: 'usuario_email', length: 500, nullable: true })
  usuarioEmail: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'is_ativo', type: 'boolean', default: true })
  isAtivo: boolean;
}