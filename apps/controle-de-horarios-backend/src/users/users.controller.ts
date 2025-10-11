// src/users/users.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
// ✅ CORRIGIR: Importar UserRole do enum, não Role da entidade
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMINISTRADOR) // ✅ CORRIGIDO
  @ApiOperation({ summary: 'Criar novo usuário (Apenas Administradores)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async create(@Body() createUserDto: CreateUserDto, @Request() req) {
    const currentUser = req.user;
    
    console.log(`➕ [CREATE_USER] Criação de usuário solicitada por: ${currentUser.email} (${currentUser.role})`);
    console.log(`   📝 Dados: { email: ${createUserDto.email}, firstName: ${createUserDto.firstName}, role: ${createUserDto.role} }`);
    
    try {
      const newUser = await this.usersService.create(createUserDto);
      
      console.log(`✅ [CREATE_USER] Usuário criado com sucesso - ID: ${newUser.id}, Email: ${newUser.email}`);
      
      return newUser;
    } catch (error) {
      console.log(`❌ [CREATE_USER] Erro ao criar usuário: ${error.message}`);
      throw error;
    }
  }

  @Get()
  @Roles(UserRole.GERENTE) // ✅ ADICIONAR ROLE PARA LISTAR USUÁRIOS
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiResponse({ status: 200, description: 'Lista de usuários' })
  async findAll(@Request() req) {
    const currentUser = req.user;
    
    console.log(`👥 [LIST_USERS] Listagem de usuários solicitada por: ${currentUser.email} (${currentUser.role})`);
    
    try {
      const users = await this.usersService.findAll();
      
      console.log(`✅ [LIST_USERS] ${users.length} usuários retornados para: ${currentUser.email}`);
      
      return users;
    } catch (error) {
      console.log(`❌ [LIST_USERS] Erro ao listar usuários: ${error.message}`);
      throw error;
    }
  }

  @Get('search')
  @Roles(UserRole.GERENTE) // ✅ ADICIONAR ROLE PARA BUSCAR USUÁRIOS
  @ApiOperation({ summary: 'Buscar usuários' })
  @ApiQuery({ name: 'q', description: 'Termo de busca' })
  @ApiResponse({ status: 200, description: 'Usuários encontrados' })
  async search(@Query('q') query: string, @Request() req) {
    const currentUser = req.user;
    
    console.log(`🔍 [SEARCH_USERS] Busca por "${query}" solicitada por: ${currentUser.email}`);
    
    try {
      const users = await this.usersService.search(query);
      
      console.log(`✅ [SEARCH_USERS] ${users.length} usuários encontrados para "${query}"`);
      
      return users;
    } catch (error) {
      console.log(`❌ [SEARCH_USERS] Erro na busca: ${error.message}`);
      throw error;
    }
  }

  @Get('stats')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE) // ✅ CORRIGIDO
  @ApiOperation({ summary: 'Estatísticas de usuários' })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  async getStats(@Request() req) {
    const currentUser = req.user;
    
    console.log(`📊 [USER_STATS] Estatísticas solicitadas por: ${currentUser.email} (${currentUser.role})`);
    
    try {
      const stats = await this.usersService.getStats();
      
      console.log(`✅ [USER_STATS] Estatísticas retornadas para: ${currentUser.email}`);
      
      return stats;
    } catch (error) {
      console.log(`❌ [USER_STATS] Erro ao buscar estatísticas: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  @Roles(UserRole.GERENTE) // ✅ ADICIONAR ROLE
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const currentUser = req.user;
    
    console.log(`👤 [GET_USER] Busca por usuário ID: ${id} solicitada por: ${currentUser.email}`);
    
    try {
      const user = await this.usersService.findOne(id);
      
      console.log(`✅ [GET_USER] Usuário encontrado: ${user.email} para solicitante: ${currentUser.email}`);
      
      return user;
    } catch (error) {
      console.log(`❌ [GET_USER] Erro ao buscar usuário ID ${id}: ${error.message}`);
      throw error;
    }
  }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE) // ✅ CORRIGIDO
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Usuário atualizado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    const currentUser = req.user;
    
    console.log(`✏️ [UPDATE_USER] Atualização do usuário ID: ${id} solicitada por: ${currentUser.email} (${currentUser.role})`);
    console.log(`   📝 Dados para atualizar:`, Object.keys(updateUserDto));
    
    try {
      const updatedUser = await this.usersService.update(id, updateUserDto);
      
      console.log(`✅ [UPDATE_USER] Usuário ${updatedUser.email} atualizado com sucesso por: ${currentUser.email}`);
      
      return updatedUser;
    } catch (error) {
      console.log(`❌ [UPDATE_USER] Erro ao atualizar usuário ID ${id}: ${error.message}`);
      throw error;
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRADOR) // ✅ CORRIGIDO
  @ApiOperation({ summary: 'Deletar usuário (Apenas Administradores)' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário deletado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const currentUser = req.user;
    
    console.log(`🗑️ [DELETE_USER] Exclusão do usuário ID: ${id} solicitada por: ${currentUser.email} (${currentUser.role})`);
    
    try {
      const result = await this.usersService.remove(id);
      
      console.log(`✅ [DELETE_USER] Usuário ID: ${id} deletado com sucesso por: ${currentUser.email}`);
      
      return result;
    } catch (error) {
      console.log(`❌ [DELETE_USER] Erro ao deletar usuário ID ${id}: ${error.message}`);
      throw error;
    }
  }
}