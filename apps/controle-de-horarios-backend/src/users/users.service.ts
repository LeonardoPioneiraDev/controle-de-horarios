import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRole, UserStatus } from '@/common/enums';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    console.log(`➕ [CREATE_USER] Iniciando criação de usuário: ${createUserDto.email}`);

    // Verificar se e-mail já existe
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      console.log(`❌ [CREATE_USER] E-mail já existe: ${createUserDto.email}`);
      throw new ConflictException('E-mail já está em uso');
    }

    // Regra de domínio de e-mail desabilitada temporariamente (permitir qualquer domínio)

    // Gerar senha temporária e token de reset
    const tempPassword = this.generateTempPassword();
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    console.log(`🔑 [CREATE_USER] Senha temporária gerada: ${tempPassword}`);
    console.log(`🔗 [CREATE_USER] Token de reset gerado: ${resetToken}`);

    // Hash da senha temporária
    const saltRounds = 12;
    const hashedTempPassword = await bcrypt.hash(tempPassword, saltRounds);

    // Criar usuário
    const user = this.usersRepository.create({
      ...createUserDto,
      tempPassword: hashedTempPassword,
      tempPasswordExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
      status: UserStatus.PENDING,
      emailVerified: false,
      firstLogin: true,
    });

    const savedUser = await this.usersRepository.save(user);
    console.log(`✅ [CREATE_USER] Usuário criado: ${createUserDto.email} - ID: ${savedUser.id}`);

    // Enviar e-mail de boas-vindas
    try {
      const emailSent = await this.emailService.sendWelcomeEmail(
        savedUser.email,
        savedUser.firstName,
        tempPassword, // Senha em texto plano para o e-mail
        resetToken
      );

      if (emailSent) {
        console.log(`✅ [CREATE_USER] E-mail enviado com sucesso para: ${savedUser.email}`);
      } else {
        console.log(`⚠️ [CREATE_USER] E-mail não foi enviado para: ${savedUser.email} (modo simulação ou erro)`);
      }
    } catch (emailError) {
      console.log(`❌ [CREATE_USER] Erro ao enviar e-mail: ${emailError.message}`);
      // Não falhar a criação do usuário por erro de e-mail
    }

    // Logs de simulação para desenvolvimento
    console.log(`📧 [EMAIL] E-mail ${this.configService.get('EMAIL_ENABLED') === 'true' ? 'habilitado' : 'desabilitado'} - ${this.configService.get('EMAIL_ENABLED') === 'true' ? 'Enviando' : 'Simulando envio'} para: ${savedUser.email}`);
    console.log(`📧 [EMAIL] Dados que seriam enviados:`);
    console.log(`   👤 Nome: ${savedUser.firstName}`);
    console.log(`   🔑 Senha Temporária: ${tempPassword}`);
    console.log(`   🔗 Token de Reset: ${resetToken}`);
    console.log(`   🌐 Link: ${this.configService.get('FRONTEND_URL', 'https://horarios.vpioneira.com.br')}/first-login?token=${resetToken}`);

    return savedUser;
  }

  private generateTempPassword(): string {
    // Gerar senha temporária de 8 caracteres
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async findAll(): Promise<User[]> {
    console.log(`👥 [LIST_USERS] Listagem de usuários solicitada por: administrador`);
    console.log(`👥 [LIST_USERS] Buscando todos os usuários`);
    
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' }
    });

    console.log(`✅ [LIST_USERS] ${users.length} usuários encontrados`);
    console.log(`✅ [LIST_USERS] ${users.length} usuários retornados para: administrador`);
    
    return users;
  }

  async findOne(id: string): Promise<User> {
    console.log(`👤 [GET_USER] Buscando usuário por ID: ${id}`);
    
    const user = await this.usersRepository.findOne({
      where: { id }
    });

    if (!user) {
      console.log(`❌ [GET_USER] Usuário não encontrado: ${id}`);
      throw new NotFoundException('Usuário não encontrado');
    }

    console.log(`✅ [GET_USER] Usuário encontrado: ${user.email}`);
    
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    console.log(`🔍 [FIND_BY_EMAIL] Buscando usuário por email: ${email}`);
    
    const user = await this.usersRepository.findOne({
      where: { email: email.toLowerCase() }
    });

    if (user) {
      console.log(`✅ [FIND_BY_EMAIL] Usuário encontrado: ${email}`);
    } else {
      console.log(`❌ [FIND_BY_EMAIL] Usuário não encontrado: ${email}`);
    }

    return user;
  }

  // ✅ NOVO MÉTODO PARA BUSCAR POR TOKEN DE RESET
  async findByResetToken(token: string): Promise<User | null> {
    console.log(`🔍 [FIND_BY_RESET_TOKEN] Buscando usuário por token de reset`);
    
    const user = await this.usersRepository.findOne({
      where: { passwordResetToken: token }
    });

    if (user) {
      console.log(`✅ [FIND_BY_RESET_TOKEN] Usuário encontrado: ${user.email}`);
    } else {
      console.log(`❌ [FIND_BY_RESET_TOKEN] Usuário não encontrado para o token`);
    }

    return user;
  }

  // ✅ NOVO MÉTODO PARA BUSCAR POR TOKEN DE VERIFICAÇÃO DE EMAIL
  async findByEmailVerificationToken(token: string): Promise<User | null> {
    console.log(`🔍 [FIND_BY_EMAIL_TOKEN] Buscando usuário por token de verificação de email`);
    
    const user = await this.usersRepository.findOne({
      where: { emailVerificationToken: token }
    });

    if (user) {
      console.log(`✅ [FIND_BY_EMAIL_TOKEN] Usuário encontrado: ${user.email}`);
    } else {
      console.log(`❌ [FIND_BY_EMAIL_TOKEN] Usuário não encontrado para o token`);
    }

    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    console.log(`🔐 [VALIDATE_USER] Validando usuário: ${email}`);
    
    const user = await this.findByEmail(email);
    if (!user) {
      console.log(`❌ [VALIDATE_USER] Usuário não encontrado: ${email}`);
      return null;
    }

    console.log(`✅ [VALIDATE_USER] Usuário encontrado: ${email} - ID: ${user.id}`);
    console.log(`🔍 [VALIDATE_USER] Status: ${user.status}, HasPassword: ${!!user.password}, HasTempPassword: ${!!user.tempPassword}`);

    // Verificar se está bloqueado
    if (user.isLocked) {
      console.log(`🔒 [VALIDATE_USER] Usuário bloqueado: ${email} - Locked until: ${user.lockedUntil}`);
      throw new BadRequestException('Usuário bloqueado temporariamente');
    }

    // Verificar senha normal
    if (user.password) {
      console.log(`🔑 [VALIDATE_USER] Testando senha normal para: ${email}`);
      const isPasswordValid = await user.validatePassword(password);
      console.log(`🔑 [VALIDATE_USER] Senha normal válida: ${isPasswordValid} para: ${email}`);
      
      if (isPasswordValid) {
        console.log(`✅ [VALIDATE_USER] Senha normal válida para: ${email}`);
        user.resetLoginAttempts();
        await this.usersRepository.save(user);
        return user;
      }
    }

    // Verificar senha temporária
    if (user.tempPassword && user.isTempPasswordValid()) {
      console.log(`🔑 [VALIDATE_USER] Testando senha temporária para: ${email}`);
      const isTempPasswordValid = await user.compareTempPassword(password);
      console.log(`🔑 [VALIDATE_USER] Senha temporária válida: ${isTempPasswordValid} para: ${email}`);
      
      if (isTempPasswordValid) {
        console.log(`✅ [VALIDATE_USER] Senha temporária válida para: ${email}`);
        user.resetLoginAttempts();
        await this.usersRepository.save(user);
        return user;
      }
    }

    // Senha incorreta - incrementar tentativas
    console.log(`❌ [VALIDATE_USER] Senha incorreta para: ${email}`);
    user.incrementLoginAttempts();
    await this.usersRepository.save(user);
    
    return null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    console.log(`🕐 [UPDATE_LAST_LOGIN] Atualizando último login: ${userId}`);
    
    await this.usersRepository.update(userId, {
      lastLogin: new Date()
    });
  }

  async activateUser(userId: string): Promise<User> {
    console.log(`✅ [ACTIVATE_USER] Ativando usuário: ${userId}`);
    
    const user = await this.findOne(userId);
    user.status = UserStatus.ACTIVE;
    user.emailVerified = true;
    user.emailVerificationToken = null;
    
    return this.usersRepository.save(user);
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    console.log(`🔑 [RESET_PASSWORD] Redefinindo senha para: ${email}`);
    
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    user.password = newPassword; // Será hasheada automaticamente
    user.tempPassword = null;
    user.tempPasswordExpires = null;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.firstLogin = false;
    user.status = UserStatus.ACTIVE;

    await this.usersRepository.save(user);
    
    console.log(`✅ [RESET_PASSWORD] Senha redefinida com sucesso para: ${email}`);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    console.log(`✏️ [UPDATE_USER] Atualizando usuário: ${id}`);
    
    const user = await this.findOne(id);
    
    Object.assign(user, updateUserDto);
    
    const updatedUser = await this.usersRepository.save(user);
    
    console.log(`✅ [UPDATE_USER] Usuário atualizado: ${updatedUser.email}`);
    
    return updatedUser;
  }

  async remove(id: string): Promise<{ message: string }> {
    console.log(`🗑️ [DELETE_USER] Deletando usuário: ${id}`);
    
    const user = await this.findOne(id);
    
    await this.usersRepository.remove(user);
    
    console.log(`✅ [DELETE_USER] Usuário deletado: ${user.email}`);
    
    return { message: 'Usuário deletado com sucesso' };
  }

  async search(query: string): Promise<User[]> {
    console.log(`🔍 [SEARCH_USERS] Buscando por: "${query}"`);
    
    const users = await this.usersRepository.find({
      where: [
        { firstName: Like(`%${query}%`) },
        { lastName: Like(`%${query}%`) },
        { email: Like(`%${query}%`) },
      ],
      order: { createdAt: 'DESC' }
    });

    console.log(`✅ [SEARCH_USERS] ${users.length} usuários encontrados para "${query}"`);
    
    return users;
  }

  async getStats() {
    console.log(`📊 [USER_STATS] Estatísticas solicitadas por: administrador`);
    console.log(`📊 [USER_STATS] Calculando estatísticas de usuários`);
    
    const total = await this.usersRepository.count();
    const active = await this.usersRepository.count({ where: { status: UserStatus.ACTIVE } });
    const pending = await this.usersRepository.count({ where: { status: UserStatus.PENDING } });
    const inactive = await this.usersRepository.count({ where: { status: UserStatus.INACTIVE } });
    
    const byRole = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const stats = {
      total,
      byStatus: { active, pending, inactive },
      byRole: byRole.reduce((acc, item) => {
        acc[item.role] = parseInt(item.count);
        return acc;
      }, {}),
    };

    console.log(`✅ [USER_STATS] Estatísticas calculadas:`, stats);
    console.log(`✅ [USER_STATS] Estatísticas retornadas para: administrador`);
    
    return stats;
  }
}
