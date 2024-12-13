import { Request } from 'express';
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, OneToOne } from 'typeorm';
import { User } from './User';

@Entity('planning')
export class Planning {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ type: 'text', nullable: false })
    plan: string;

    @OneToOne(() => User, (user) => user.questionaire)
    user: User;

    @CreateDateColumn()
    private createdDate: Date;

    @UpdateDateColumn()
    private lastModifiedDate: Date;

    constructor(req: Request) {
        if (!req) {
            return;
        }

        this.plan = req.body.plan;
    }
}