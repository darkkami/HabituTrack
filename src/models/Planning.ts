import { Request } from 'express';
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('planning')
export class Planning {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ type: 'text', nullable: false })
    plan: string;

    @OneToOne(() => User)
    @JoinColumn()
    user: User;

    @CreateDateColumn()
    private createdDate: Date;

    @UpdateDateColumn()
    private lastModifiedDate: Date;

    constructor(plan: string, user: User) {
        if (!plan || !user) {
            return;
        }

        this.plan = plan;
        this.user = user;
    }
}