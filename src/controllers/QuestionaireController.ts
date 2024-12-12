import { Request, Response } from 'express';
import AppDataSource from '../database/db_config';
import { DeleteResult, QueryFailedError, Repository } from 'typeorm';
import { User } from '../models/User';
import { Questionaire } from '../models/Questionaire';
import { StatusCodes } from 'http-status-codes';
import { ErrorMessages } from '../util/ErrorMessages';
import { ReturnMessages } from '../models/ReturnMessages';
import log4js from 'log4js';
import { OpenAI } from "openai";

class QuestionaireController {

    public async init(req: Request, res: Response): Promise<void> {
        const userRepository: Repository<User> = AppDataSource.getRepository(User);
        const questionaireRepository: Repository<Questionaire> = AppDataSource.getRepository(Questionaire);
        const userId: number = req.body.userId;
        const logger = log4js.getLogger();

        logger.debug(req.body);

        if (!userId) {
            res.status(StatusCodes.BAD_REQUEST).json(
                new ReturnMessages(
                    StatusCodes.BAD_REQUEST,
                    ErrorMessages.MISSING_MADATORY_FIELD,
                    null));
            return;
        }

        userRepository.findOneOrFail({ where: { id: userId } }).then((user: User) => {
            const questionaire: Questionaire = new Questionaire(req);
            questionaireRepository.save(questionaire)
                .then(() => {
                    res.status(StatusCodes.CREATED).send();
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

    public async createPlan (req: Request, res: Response): Promise<void> {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const logger = log4js.getLogger();

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: "Você poderia criar um plano de exercícios físicos para mim? Meu objetivo é perda de peso." }],
        });

        logger.debug(completion.choices[0].message);
        res.send(completion.choices[0].message);
    }
}

export default new QuestionaireController();