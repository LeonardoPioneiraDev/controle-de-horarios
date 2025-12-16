import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFilter } from '../entities/user-filter.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class UserFiltersService {
    private readonly logger = new Logger(UserFiltersService.name);

    constructor(
        @InjectRepository(UserFilter)
        private userFiltersRepository: Repository<UserFilter>,
    ) { }

    async findAll(user: User): Promise<UserFilter[]> {
        const filters = await this.userFiltersRepository.find({
            where: { userId: user.id },
            order: { createdAt: 'DESC' },
        });
        this.logger.log(`✅ Encontrados ${filters.length} filtros para usuário ${user.email}`);
        return filters;
    }

    async create(user: User, data: Partial<UserFilter>): Promise<UserFilter> {
        const count = await this.userFiltersRepository.count({ where: { userId: user.id } });
        if (count >= 10) {
            this.logger.warn(`⚠️ Limite de filtros atingido para usuário ${user.email}`);
            throw new BadRequestException('Limite de 10 filtros salvos atingido.');
        }

        const existing = await this.userFiltersRepository.findOne({
            where: { userId: user.id, name: data.name },
        });

        if (existing) {
            this.logger.warn(`⚠️ Filtro com nome duplicado para usuário ${user.email}: ${data.name}`);
            throw new BadRequestException('Já existe um filtro com este nome.');
        }

        const filter = this.userFiltersRepository.create({
            ...data,
            userId: user.id,
        });

        const saved = await this.userFiltersRepository.save(filter);
        this.logger.log(`✅ Filtro salvo com sucesso: ${saved.id}`);
        return saved;
    }

    async remove(user: User, id: string): Promise<void> {
        const filter = await this.userFiltersRepository.findOne({
            where: { id, userId: user.id },
        });

        if (!filter) {
            this.logger.warn(`⚠️ Filtro não encontrado para remoção: ${id}`);
            throw new NotFoundException('Filtro não encontrado.');
        }

        await this.userFiltersRepository.remove(filter);
        this.logger.log(`✅ Filtro removido com sucesso: ${id}`);
    }
}
