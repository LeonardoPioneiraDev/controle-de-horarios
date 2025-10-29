import { BaseApiService } from '../shared/api.service';
import { User, CreateUserRequest, UpdateUserRequest, UserStats } from '../../types';

export class UsersService extends BaseApiService {
  constructor() {
    super();
  }

  async getUsers(): Promise<User[]> {
    console.log('👥 Buscando lista de usuários...');
    const response = await this.api.get<User[]>('/users');
    console.log('✅ Lista de usuários obtida');
    return response.data;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    console.log('➕ Criando novo usuário...');
    const response = await this.api.post<User>('/users', userData);
    console.log('✅ Usuário criado com sucesso');
    return response.data;
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    console.log(`✏️ Atualizando usuário ${id}...`);
    const response = await this.api.patch<User>(`/users/${id}`, userData);
    console.log('✅ Usuário atualizado com sucesso');
    return response.data;
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    console.log(`🗑️ Deletando usuário ${id}...`);
    const response = await this.api.delete(`/users/${id}`);
    console.log('✅ Usuário deletado com sucesso');
    return response.data;
  }

  async getUserById(id: string): Promise<User> {
    console.log(`👤 Buscando usuário ${id}...`);
    const response = await this.api.get<User>(`/users/${id}`);
    console.log('✅ Usuário encontrado');
    return response.data;
  }

  async searchUsers(query: string): Promise<User[]> {
    console.log(`🔍 Buscando usuários: "${query}"...`);
    const response = await this.api.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
    console.log('✅ Busca realizada');
    return response.data;
  }

  async getUserStats(): Promise<UserStats> {
    console.log('📊 Buscando estatísticas de usuários...');
    const response = await this.api.get<UserStats>('/users/stats');
    console.log('✅ Estatísticas obtidas');
    return response.data;
  }
}

export const usersService = new UsersService();