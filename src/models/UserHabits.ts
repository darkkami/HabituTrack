import { Request } from 'express';
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('habits')
export class UserHabits {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ type: 'text', nullable: false })
    habit: string;

    @Column({ type: 'integer', nullable: false })
    time: number

    @ManyToOne(() => User, (user) => user.habits)
    @JoinColumn()
    user: User;

    @CreateDateColumn()
    private createdDate: Date;

    @UpdateDateColumn()
    private lastModifiedDate: Date;

    constructor(req: Request, user: User) {
        if (!user || !req) {
            return;
        }

        this.habit = req.body.habit;
        this.time = req.body.time || 0;
        this.user = user;
    }
}