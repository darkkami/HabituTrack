import { Request, Response } from 'express';
import AppDataSource from '../database/db_config';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../models/User';
import { Questionaire } from '../models/Questionaire';
import { Planning } from '../models/Planning';
import { UserHabits } from '../models/UserHabits';
import { StatusCodes } from 'http-status-codes';
import { ErrorMessages } from '../util/ErrorMessages';
import { ReturnMessages } from '../models/ReturnMessages';
import log4js from 'log4js';
import { OpenAI } from "openai";

class PlanningController {
    public createPlan (req: Request, res: Response): void {
        const userRepository: Repository<User> = AppDataSource.getRepository(User);
        const questionaireRepository: Repository<Questionaire> = AppDataSource.getRepository(Questionaire);
        const logger = log4js.getLogger();
        
        if(!process.env.OPENAI_API_KEY) {
            logger.error("OpenAI API Key nao configurada");

            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
                new ReturnMessages("error",
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    ErrorMessages.MISSING_MADATORY_FIELD,
                    null));
            return;
        }
        
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const userId: number = req.userId;

        if (!userId) {
            res.status(StatusCodes.BAD_REQUEST).json(
                new ReturnMessages("error",
                    StatusCodes.BAD_REQUEST,
                    ErrorMessages.MISSING_MADATORY_FIELD,
                    null));
            return;
        }

        userRepository.findOneOrFail({ where: { id: userId } }).then((user: User) => {

            questionaireRepository.findOneOrFail({ where: { user: {id: user.id}}, relations: ["user"] }).then(async (questionaire: Questionaire) => {
                    let objetivo = questionaire.objetivo;
                    let motivacao = questionaire.motivacao;
                    let cronotipo = questionaire.cronotipo;
                    let rotinaAlimentar = questionaire.rotinaAlimentar;
                    let frequenciaExercicio = questionaire.frequenciaExercicio;
                    let obstaculos = questionaire.obstaculos;
                    let restricoesAlimentares = questionaire.restricoesAlimentares;
                    let nivelEstresse = questionaire.nivelEstresse;
                    let hobbies = questionaire.hobbies;

                    let message = `Crie uma nova estratégia de exercícios físicos para mim. Considere as seguintes informações:\n
                    Objetivo: ${objetivo}\nMotivação: ${motivacao}\nCronotipo: ${cronotipo}\n
                    Rotina Alimentar: ${rotinaAlimentar}\nFrequência de Exercício: ${frequenciaExercicio}\n
                    Obstáculos: ${obstaculos}\nRestrições Alimentares: ${restricoesAlimentares}\nNível de Estresse: ${nivelEstresse}\nHobbies: ${hobbies}`;

                    const completion = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [{ role: "user", content: message }],
                    });

                    const planningRepository: Repository<Planning> = AppDataSource.getRepository(Planning);
                    const planContent = completion.choices[0].message.content || "Não foi possível gerar um plano de exercícios físicos. Por favor, tente novamente mais tarde.";
                    const planning: Planning = new Planning(planContent, user);

                    planningRepository.save(planning)
                        .then(() => {
                            res.json({
                                "_links": [
                                    {
                                        "rel": "self",
                                        "href": "/plan/" + planning.id
                                    }
                                ]
                            });
                        })
                        .catch((error: QueryFailedError) => {
                            logger.error(error);
                            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                                new ReturnMessages("error",
                                    StatusCodes.INTERNAL_SERVER_ERROR,
                                    error.message,
                                    error.stack));
                        });
                })
                .catch((error: QueryFailedError) => {
                    logger.error(error);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                        new ReturnMessages("error",
                            StatusCodes.INTERNAL_SERVER_ERROR,
                            error.message,
                            error.stack));
                });
        }).catch((error: Error) => {
            logger.error(error);
            res.status(StatusCodes.NOT_FOUND).send(
                new ReturnMessages("error",
                    StatusCodes.NOT_FOUND,
                    error.message,
                    error.stack));
        });
    }

    public getPlan (req: Request, res: Response): void {
        const planningRepository: Repository<Planning> = AppDataSource.getRepository(Planning);
        const logger = log4js.getLogger();

        const planId: number = parseInt(req.params.planId);

        if (!planId) {
            res.status(StatusCodes.BAD_REQUEST).json(
                new ReturnMessages("error",
                    StatusCodes.BAD_REQUEST,
                    ErrorMessages.MISSING_MADATORY_FIELD,
                    null));
            return;
        }

        planningRepository.findOneOrFail({ where: { id: planId }, relations: ["user"] }).then((planning: Planning) => {
            res.json({
                "_links": [
                    {
                        "rel": "self",
                        "href": "/plan/" + planning.id
                    },
                    {
                        "rel": "create_plan",
                        "href": "/plan"
                    }
                ],
                "plan": planning.plan
            });
        }).catch((error: QueryFailedError) => {
            logger.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                new ReturnMessages("error",
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    error.message,
                    error.stack));
        });
    }

    public createHabit (req: Request, res: Response): void {
        const userRepository: Repository<User> = AppDataSource.getRepository(User);
        const logger = log4js.getLogger();

        const userId: number = req.userId;

        if (!userId) {
            res.status(StatusCodes.BAD_REQUEST).json(
                new ReturnMessages("error",
                    StatusCodes.BAD_REQUEST,
                    ErrorMessages.MISSING_MADATORY_FIELD,
                    null));
            return;
        }

        userRepository.findOneOrFail({ where: { id: userId } }).then((user: User) => {
            const habitRepository: Repository<UserHabits> = AppDataSource.getRepository(UserHabits);
            const habit: UserHabits = new UserHabits(req, user);

            habitRepository.save(habit)
                .then(() => {
                    res.json({
                        "_links": [
                            {
                                "rel": "self",
                                "href": "/habit/" + habit.id
                            },
                            {
                                "rel": "update_habit",
                                "href": "/habit/" + habit.id
                            }
                        ]
                    });
                })
                .catch((error: QueryFailedError) => {
                    logger.error(error);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                        new ReturnMessages("error",
                            StatusCodes.INTERNAL_SERVER_ERROR,
                            error.message,
                            error.stack));
                });
        })
        .catch((error: QueryFailedError) => {
            logger.error(error);
            res.status(StatusCodes.NOT_FOUND).send(
                new ReturnMessages("error",
                    StatusCodes.NOT_FOUND,
                    error.message,
                    error.stack));
        });
    }

    public updateHabit (req: Request, res: Response): void {
        const userRepository: Repository<User> = AppDataSource.getRepository(User);
        const habitRepository: Repository<UserHabits> = AppDataSource.getRepository(UserHabits);
        const logger = log4js.getLogger();

        const habitId: number = parseInt(req.params.habitId);
        const userId: number = req.userId;

        if (!habitId || !userId) {
            res.status(StatusCodes.BAD_REQUEST).json(
                new ReturnMessages("error",
                    StatusCodes.BAD_REQUEST,
                    ErrorMessages.MISSING_MADATORY_FIELD,
                    null));
            return;
        }

        userRepository.findOneOrFail({ where: { id: userId } }).then((user: User) => {
            const habit: UserHabits = new UserHabits(req, user);
            habitRepository.save(habit)
                .then(() => {
                    res.json({
                        "_links": [
                            {
                                "rel": "self",
                                "href": "/habit/" + habit.id
                            },
                            {
                                "rel": "update_habit",
                                "href": "/habit/" + habit.id
                            }
                        ]
                    });
                })
                .catch((error: QueryFailedError) => {
                    logger.error(error);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                        new ReturnMessages("error",
                            StatusCodes.INTERNAL_SERVER_ERROR,
                            error.message,
                            error.stack));
                });
        }).catch((error: QueryFailedError) => {
            logger.error(error);
            res.status(StatusCodes.NOT_FOUND).send(
                new ReturnMessages("error",
                    StatusCodes.NOT_FOUND,
                    error.message,
                    error.stack));
        });
    }

    public getHabit (req: Request, res: Response): void {
        const habitRepository: Repository<UserHabits> = AppDataSource.getRepository(UserHabits);
        const logger = log4js.getLogger();

        const habitId: number = parseInt(req.params.habitId);

        if (!habitId) {
            res.status(StatusCodes.BAD_REQUEST).json(
                new ReturnMessages("error",
                    StatusCodes.BAD_REQUEST,
                    ErrorMessages.MISSING_MADATORY_FIELD,
                    null));
            return;
        }

        habitRepository.findOneOrFail({ where: { id: habitId }, relations: ["user"] }).then((habit: UserHabits) => {
            res.json({
                "_links": [
                    {
                        "rel": "update_habit",
                        "href": "/habit/" + habit.id
                    }
                ],
                "habit": habit
            });
        }).catch((error: QueryFailedError) => {
            logger.error(error);
            res.status(StatusCodes.NOT_FOUND).send(
                new ReturnMessages("error",
                    StatusCodes.NOT_FOUND,
                    error.message,
                    error.stack));
        });
    }
}

export default new PlanningController();