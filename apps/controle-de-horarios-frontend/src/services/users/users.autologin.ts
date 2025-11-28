import { BaseApiService } from '../shared/api.service';
import type { User } from '../../types';

export interface CreateDirectorAutologinRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export interface CreateDirectorAutologinResponse {
  user: User;
  autologinToken: string;
  autologinUrl: string;
}

export class UsersAutologinService extends BaseApiService {
  constructor() {
    super();
  }

  async createDirectorAutologin(data: CreateDirectorAutologinRequest): Promise<CreateDirectorAutologinResponse> {
    // Use caminho relativo sem barra inicial para garantir junção correta com baseURL
    const response = await this.api.post<CreateDirectorAutologinResponse>('users/diretor-autologin', data);
    return response.data;
  }
}

export const usersAutologinService = new UsersAutologinService();
