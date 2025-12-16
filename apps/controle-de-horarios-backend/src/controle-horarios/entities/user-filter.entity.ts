import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_filters')
@Index(['user', 'name'], { unique: true })
export class UserFilter {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'jsonb', nullable: true })
    filters: any;

    @Column({ type: 'varchar', length: 20, nullable: true })
    tipoLocal: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    statusEdicaoLocal: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    userId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
