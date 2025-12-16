import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Logger } from '@nestjs/common';
import { UserFiltersService } from '../services/user-filters.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';

@Controller('user-filters')
@UseGuards(JwtAuthGuard)
export class UserFiltersController {
    private readonly logger = new Logger(UserFiltersController.name);

    constructor(private readonly userFiltersService: UserFiltersService) { }

    @Get()
    async findAll(@Request() req) {
        this.logger.log(`🔍 Buscando filtros salvos para usuário: ${req.user.email}`);
        return this.userFiltersService.findAll(req.user as User);
    }

    @Post()
    async create(@Request() req, @Body() body: any) {
        this.logger.log(`💾 Salvando novo filtro para usuário: ${req.user.email} - Nome: ${body.name}`);
        return this.userFiltersService.create(req.user as User, body);
    }

    @Delete(':id')
    async remove(@Request() req, @Param('id') id: string) {
        this.logger.log(`🗑️ Removendo filtro ${id} para usuário: ${req.user.email}`);
        return this.userFiltersService.remove(req.user as User, id);
    }
}
