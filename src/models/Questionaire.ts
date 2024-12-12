import { Request } from 'express';
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, OneToOne } from 'typeorm';
import { User } from './User';

@Entity('questionaires')
export class Questionaire {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ type: 'text', nullable: false })
    objetivo: string;

    @Column({ type: 'integer', nullable: false })
    motivacao: 1 | 2 | 3 | 4 | 5;

    @Column({ type: 'text', nullable: false })
    cronotipo: "Manha" | "Tarde" | "Noite";

    @Column({ type: 'text', nullable: false })
    rotinaAlimentar: string;

    @Column({ type: 'text', nullable: false })
    frequenciaExercicio: "Nunca" | "1-2 vezes por semana" | "3-4 vezes por semana" | "5-6 vezes por semana" | "Todos os dias";

    @Column({ type: 'text', nullable: true })
    obstaculos: string;

    @Column({ type: 'text', nullable: true })
    restricoesAlimentares: string;

    @Column({ type: 'integer', nullable: false })
    nivelEstresse: 1 | 2 | 3 | 4 | 5;

    @Column({ type: 'text', nullable: true })
    hobbies: string;

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

        this.objetivo = req.body.objetivo;
        this.motivacao = req.body.motivacao;
        this.cronotipo = req.body.cronotipo;
        this.rotinaAlimentar = req.body.rotinaAlimentar;
        this.frequenciaExercicio = req.body.frequenciaExercicio;
        this.obstaculos = req.body.obstaculos;
        this.restricoesAlimentares = req.body.restricoesAlimentares;
        this.nivelEstresse = req.body.nivelEstresse;
        this.hobbies = req.body.hobbies;
    }
}