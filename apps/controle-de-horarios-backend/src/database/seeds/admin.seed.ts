import { DataSource } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { UserRole, UserStatus } from '@/common/enums';
import * as bcrypt from 'bcryptjs';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  // Verificar se admin já existe
  const existingAdmin = await userRepository.findOne({
    where: { email: 'leonardolopes@vpioneira.com.br' }
  });

  if (existingAdmin) {
    console.log('✅ Usuário admin já existe');
    return;
  }

  // Criar usuário admin
  const admin = new User();
  admin.email = 'leonardolopes@vpioneira.com.br';
  admin.password = await bcrypt.hash('Admin@123456', 12);
  admin.firstName = 'Leonardo';
  admin.lastName = 'Lopes';
  admin.role = UserRole.ADMINISTRADOR;
  admin.status = UserStatus.ACTIVE;
  admin.emailVerified = true;

  await userRepository.save(admin);
  
  console.log('✅ Usuário admin criado com sucesso!');
  console.log('📧 Email: leonardolopes@vpioneira.com.br');
  console.log('🔑 Senha: Admin@123456');
}

// Executar seed se chamado diretamente
if (require.main === module) {
  import('../data-source').then(async ({ AppDataSource }) => {
    try {
      await AppDataSource.initialize();
      await seedAdmin(AppDataSource);
      await AppDataSource.destroy();
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro ao executar seed:', error);
      process.exit(1);
    }
  });
}