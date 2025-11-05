import { BaseApiService } from '../shared/api.service';
import { User, CreateUserRequest, UpdateUserRequest, UserStats } from '../../types';

const toDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
};

const mapUser = (u: any): User => ({
  ...u,
  createdAt: (toDate(u.createdAt) as Date) || new Date(),
  updatedAt: (toDate(u.updatedAt) as Date) || new Date(),
  lastLogin: toDate(u.lastLogin),
  tempPasswordExpires: (toDate(u.tempPasswordExpires) as any) ?? null,
  passwordResetExpires: (toDate(u.passwordResetExpires) as any) ?? null,
  lockedUntil: (toDate(u.lockedUntil) as any) ?? null,
});

export class UsersService extends BaseApiService {
  constructor() {
    super();
  }

  async getUsers(): Promise<User[]> {
    console.log('??? Buscando lista de usuários...');
    const response = await this.api.get<any[]>('/users');
    console.log('? Lista de usuários obtida');
    return (response.data || []).map(mapUser);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    console.log('? Criando novo usuário...');
    const response = await this.api.post<any>('/users', userData);
    console.log('? Usuário criado com sucesso');
    return mapUser(response.data);
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    console.log(`?? Atualizando usuário ${id}...`);
    const response = await this.api.patch<any>(`/users/${id}`, userData);
    console.log('? Usuário atualizado com sucesso');
    return mapUser(response.data);
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    console.log(`??? Deletando usuário ${id}...`);
    const response = await this.api.delete<{ message: string }>(`/users/${id}`);
    console.log('? Usuário deletado com sucesso');
    return response.data;
  }

  async getUserById(id: string): Promise<User> {
    console.log(`?? Buscando usuário ${id}...`);
    const response = await this.api.get<any>(`/users/${id}`);
    console.log('? Usuário encontrado');
    return mapUser(response.data);
  }

  async searchUsers(query: string): Promise<User[]> {
    console.log(`?? Buscando usuários: "${query}"...`);
    const response = await this.api.get<any[]>(`/users/search?q=${encodeURIComponent(query)}`);
    console.log('? Busca realizada');
    return (response.data || []).map(mapUser);
  }

  async getUserStats(): Promise<UserStats> {
    console.log('?? Buscando estatísticas de usuários...');
    const response = await this.api.get<UserStats>('/users/stats');
    console.log('? Estatísticas obtidas');
    return response.data;
  }
}

export const usersService = new UsersService();
