import { BaseApiService } from './shared/api.service';
import { authService } from './auth/auth.service';
import { usersService } from './users/users.service';
import { viagensTransdataService } from './viagens-transdata/viagens-transdata.service';
import { controleHorariosService } from "../features/controle-horarios/services/controle-horarios.service"; // ✅ CAMINHO 
import { emailService } from './email/email.service';
import { healthService } from './health/health.service';

// Export all services
export {
  authService,
  usersService,
  viagensTransdataService,
  controleHorariosService,
  emailService,
  healthService,
};

// Re-export makeAuthenticatedRequest for backward compatibility if needed
export { makeAuthenticatedRequest } from './shared/api.service';

// Initialize base API service for initial connectivity test
const apiService = new BaseApiService();
healthService.testConnectivity();
