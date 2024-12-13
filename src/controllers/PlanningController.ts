import { Request, Response } from 'express';
import AppDataSource from '../database/db_config';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../models/User';
import { Questionaire } from '../models/Questionaire';
import { StatusCodes } from 'http-status-codes';
import { ErrorMessages } from '../util/ErrorMessages';
import { ReturnMessages } from '../models/ReturnMessages';
import log4js from 'log4js';
import { OpenAI } from "openai";

class PlanningController {
    public createPlan (req: Request, res: Response): void {
        const userRepository: Repository<User> = AppDataSource.getRepository(User);
        const questionaireRepository: Repository<Questionaire> = AppDataSource.getRepository(Questionaire);
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const logger = log4js.getLogger();

        const userId: number = req.body.userId;

        if (!userId) {
            res.status(StatusCodes.BAD_REQUEST).json(
                new ReturnMessages(
                    StatusCodes.BAD_REQUEST,
                    ErrorMessages.MISSING_MADATORY_FIELD,
                    null));
            return;
        }

        userRepository.findOneOrFail({ where: { id: userId } }).then((user: User) => {

            questionaireRepository.findOneOrFail({ where: { user: user} }).then(async (questionaire: Questionaire) => {
                    let objetivo = questionaire.objetivo;
                    let motivacao = questionaire.motivacao;
                    let cronotipo = questionaire.cronotipo;
                    let rotinaAlimentar = questionaire.rotinaAlimentar;
                    let frequenciaExercicio = questionaire.frequenciaExercicio;
                    let obstaculos = questionaire.obstaculos;
                    let restricoesAlimentares = questionaire.restricoesAlimentares;
                    let nivelEstresse = questionaire.nivelEstresse;
                    let hobbies = questionaire.hobbies;

                    let message = `Crie uma estratégia de exercícios físicos para mim. Considere as seguintes informações:\n
                    Objetivo: ${objetivo}\nMotivação: ${motivacao}\nCronotipo: ${cronotipo}\n
                    Rotina Alimentar: ${rotinaAlimentar}\nFrequência de Exercício: ${frequenciaExercicio}\n
                    Obstáculos: ${obstaculos}\nRestrições Alimentares: ${restricoesAlimentares}\nNível de Estresse: ${nivelEstresse}\nHobbies: ${hobbies}`;

                    const completion = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [{ role: "user", content: message }],
                    });

                    logger.debug(completion.choices[0].message);
                    res.send(completion.choices[0].message);
                })
                .catch((error: QueryFailedError) => {
                    logger.error(error);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                        new ReturnMessages(
                            StatusCodes.INTERNAL_SERVER_ERROR,
                            error.message,
                            error.stack));
                });
        }).catch((error) => {
            logger.error(error);
            res.status(StatusCodes.NOT_FOUND).send(
                new ReturnMessages(
                    StatusCodes.NOT_FOUND,
                    error.message,
                    error.stack));
        });
    }

    public getPlan (req: Request, res: Response): void {
        res.status(StatusCodes.CREATED).send(
            new ReturnMessages(
                StatusCodes.CREATED,
                "CRIOU",
                "CRIOU O PLANO"));
    }
}

export default new PlanningController();