import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';

import { UserRole, UserRoleHierarchy } from '@/common/enums';


export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

// Alias para compatibilidade
export const Role = UserRole;

@Entity('users')
@Index(['email'], { unique: true })
@Index(['status'])
@Index(['role'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  password: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.OPERADOR
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING
  })
  status: UserStatus;

  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'email_verification_token'
  })
  @Exclude()
  emailVerificationToken: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'temp_password'
  })
  @Exclude()
  tempPassword: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'temp_password_expires'
  })
  tempPasswordExpires: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'password_reset_token'
  })
  @Exclude()
  passwordResetToken: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'password_reset_expires'
  })
  @Exclude()
  passwordResetExpires: Date;

  @Column({ type: 'boolean', default: true, name: 'first_login' })
  firstLogin: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_login'
  })
  lastLogin: Date;

  @Column({ type: 'int', default: 0, name: 'login_attempts' })
  @Exclude()
  loginAttempts: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'locked_until'
  })
  @Exclude()
  lockedUntil: Date;

  @Column({ type: 'boolean', default: false, name: 'auto_login_enabled' })
  autoLoginEnabled: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
    name: 'auto_login_token'
  })
  @Exclude()
  autoLoginToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual fields
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  get roleHierarchy(): number {
    return UserRoleHierarchy[this.role] || 0;
  }

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPasswords() {
    if (this.password && !this.password.startsWith('$2')) {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
    if (this.tempPassword && !this.tempPassword.startsWith('$2')) {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      this.tempPassword = await bcrypt.hash(this.tempPassword, saltRounds);
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  // Methods
  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }

  async compareTempPassword(password: string): Promise<boolean> {
    if (!this.tempPassword) return false;
    return bcrypt.compare(password, this.tempPassword);
  }

  isTempPasswordValid(): boolean {
    if (!this.tempPasswordExpires) return false;
    return new Date() < this.tempPasswordExpires;
  }

  incrementLoginAttempts(): void {
    this.loginAttempts += 1;

    // Bloquear após 5 tentativas por 15 minutos
    if (this.loginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
  }

  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockedUntil = null;
    this.lastLogin = new Date();
  }

  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  hasRoleOrHigher(role: UserRole): boolean {
    return UserRoleHierarchy[this.role] >= UserRoleHierarchy[role];
  }

  canManageUser(targetUser: User): boolean {
    // Administrador pode gerenciar todos
    if (this.role === UserRole.ADMINISTRADOR) return true;

    // Diretor pode gerenciar todos exceto administrador
    if (this.role === UserRole.DIRETOR) {
      return targetUser.role !== UserRole.ADMINISTRADOR;
    }

    // Gerente pode gerenciar analista, operador e operador CCO
    if (this.role === UserRole.GERENTE) {
      return [UserRole.ANALISTA, UserRole.OPERADOR, UserRole.OPERADOR_CCO].includes(targetUser.role);
    }

    return false;
  }

  generateAutoLoginToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
}
