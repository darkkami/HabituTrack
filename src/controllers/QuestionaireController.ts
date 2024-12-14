import { Request, Response } from 'express';
import AppDataSource from '../database/db_config';
import { DeleteResult, QueryFailedError, Repository } from 'typeorm';
import { User } from '../models/User';
import { Questionaire } from '../models/Questionaire';
import { StatusCodes } from 'http-status-codes';
import { ErrorMessages } from '../util/ErrorMessages';
import { ReturnMessages } from '../models/ReturnMessages';
import log4js from 'log4js';

class QuestionaireController {
    public async updatePersonalInfo(req: Request, res: Response): Promise<void> {
        const userRepository: Repository<User> = AppDataSource.getRepository(User);
        const questionaireRepository: Repository<Questionaire> = AppDataSource.getRepository(Questionaire);
        const userId: number = req.userId;
        const logger = log4js.getLogger();

        if (!userId) {
            res.status(StatusCodes.BAD_REQUEST).json(
                new ReturnMessages("error",
                    StatusCodes.BAD_REQUEST,
                    ErrorMessages.MISSING_MADATORY_FIELD,
                    null));
            return;
        }

        userRepository.findOneOrFail({ where: { id: userId } }).then((user: User) => {
            const questionaire: Questionaire = new Questionaire(req, user);
            questionaireRepository.save(questionaire).then(() => {
                res.json({
                    "_links": [
                        {
                            "rel": "self",
                            "href": "/questionaire/" + questionaire.id
                        },
                        {
                            "rel": "create_plan",
                            "href": "/plan"
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
        }).catch((error: Error) => {
            logger.error(error);
            res.status(StatusCodes.NOT_FOUND).send(
                new ReturnMessages("error",
                    StatusCodes.NOT_FOUND,
                    error.message,
                    error.stack));
        });
    }
}

export default new QuestionaireController();