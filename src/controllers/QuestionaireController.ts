import { Request, Response } from 'express';
import AppDataSource from '../database/db_config';
import { DeleteResult, QueryFailedError, Repository } from 'typeorm';
import { User } from '../models/User';
import { StatusCodes } from 'http-status-codes';
import { ErrorMessages } from '../util/ErrorMessages';
import { ReturnMessages } from '../models/ReturnMessages';
import log4js from 'log4js';
import { OpenAI } from "openai";

class QuestionaireController {

    public async init(req: Request, res: Response): Promise<void> {
        const userRepository: Repository<User> = AppDataSource.getRepository(User);
        const username: string = req.body.username;
        const logger = log4js.getLogger();

        logger.debug(req.body);

        if (!username) {
            res.status(StatusCodes.BAD_REQUEST).json(
                new ReturnMessages('error',
                    StatusCodes.BAD_REQUEST,
                    ErrorMessages.MISSING_MADATORY_FIELD,
                    null));
            return;
        }


        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: "Você poderia criar um plano de exercícios físicos para mim? Meu objetivo é perda de peso." }],
        });

        logger.debug(completion.choices[0].message);
        res.send(completion.choices[0].message);
    }
}

export default new QuestionaireController();