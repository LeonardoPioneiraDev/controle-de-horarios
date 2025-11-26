import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UsersService } from '../../users/users.service';
import { UserRole, UserStatus } from '../../common/enums';
import * as crypto from 'crypto';

async function createDiretorUser() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const email = args.find(arg => arg.startsWith('--email='))?.split('=')[1];
    const firstName = args.find(arg => arg.startsWith('--firstName='))?.split('=')[1];
    const lastName = args.find(arg => arg.startsWith('--lastName='))?.split('=')[1];

    if (!email || !firstName || !lastName) {
        console.error('❌ Erro: Parâmetros obrigatórios faltando!');
        console.error('');
        console.error('Uso:');
        console.error('  npm run seed:diretor -- --email="email@empresa.com" --firstName="Nome" --lastName="Sobrenome"');
        console.error('');
        console.error('Exemplo:');
        console.error('  npm run seed:diretor -- --email="diretor@vpioneira.com.br" --firstName="João" --lastName="Silva"');
        process.exit(1);
    }

    console.log('🚀 Iniciando criação de usuário diretor...');
    console.log('');

    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    try {
        // Verificar se usuário já existe
        const existingUser = await usersService.findByEmail(email);
        if (existingUser) {
            console.error(`❌ Erro: Usuário com email ${email} já existe!`);
            console.error(`   ID: ${existingUser.id}`);
            console.error(`   Nome: ${existingUser.firstName} ${existingUser.lastName}`);
            console.error(`   Role: ${existingUser.role}`);
            process.exit(1);
        }

        // Gerar senha aleatória (não será usada, mas é necessária para o banco)
        const randomPassword = crypto.randomBytes(16).toString('hex');

        // Criar usuário diretor
        const user = await usersService.create({
            email,
            firstName,
            lastName,
            role: UserRole.DIRETOR,
        });

        // Ativar usuário e configurar autologin
        // Nota: O update deve usar apenas campos que existem no UpdateUserDto ou na entidade se for via repository direto,
        // mas aqui estamos usando o service.update que espera UpdateUserDto.
        // O create já retorna o usuário salvo. Vamos atualizar as propriedades que precisamos.

        // Gerar token de autologin
        const { token } = await usersService.enableAutoLogin(user.id);

        // Atualizar status e senha
        // O service.update pode não aceitar todos os campos se o DTO for restrito.
        // Vamos usar o repository diretamente se necessário, mas o service.update deve funcionar para campos básicos.
        // Se 'status' e 'emailVerified' não estiverem no UpdateUserDto, precisaremos de outra abordagem.
        // Assumindo que o service.activateUser resolve o status.

        await usersService.activateUser(user.id);

        // Para a senha, usamos o resetPassword interno ou update se permitido
        // O service.create já define uma senha temporária. Vamos redefinir para a aleatória.
        await usersService.resetPassword(user.email, randomPassword);

        // Buscar usuário atualizado para garantir que temos tudo
        const updatedUser = await usersService.findByAutoLoginToken(token);

        if (!updatedUser) {
            throw new Error('Falha ao recuperar usuário criado.');
        }

        console.log('✅ Usuário diretor criado com sucesso!');
        console.log('');
        console.log('📋 Detalhes do usuário:');
        console.log(`   ID: ${updatedUser.id}`);
        console.log(`   📧 Email: ${updatedUser.email}`);
        console.log(`   👤 Nome: ${updatedUser.firstName} ${updatedUser.lastName}`);
        console.log(`   🔑 Role: ${updatedUser.role}`);
        console.log(`   ✅ Status: ${updatedUser.status}`);
        console.log(`   🔓 Autologin: ${updatedUser.autoLoginEnabled ? 'Habilitado' : 'Desabilitado'}`);
        console.log('');
        console.log('🔗 URL de acesso (PRODUÇÃO):');
        console.log(`   https://horarios.vpioneira.com.br/autologin/${token}`);
        console.log('');
        console.log('🔗 URL de acesso (DESENVOLVIMENTO):');
        console.log(`   http://localhost:5173/autologin/${token}`);
        console.log('');
        console.log('⚠️  IMPORTANTE: Guarde esta URL em local seguro!');
        console.log('   Esta é a única forma de acessar a conta do diretor.');
        console.log('');

    } catch (error) {
        console.error('❌ Erro ao criar usuário diretor:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await app.close();
    }
}

createDiretorUser();
