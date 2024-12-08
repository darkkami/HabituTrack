import { Request, Response } from 'express';
import AppDataSource from '../database/db_config';
import { DeleteResult, QueryFailedError, Repository } from 'typeorm';
import { User } from '../models/User';
import { StatusCodes } from 'http-status-codes';
import { ErrorMessages } from '../util/ErrorMessages';
import { ReturnMessages } from '../models/ReturnMessages';
import log4js from 'log4js';

class UserController {
    public create(req: Request, res: Response): void {
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

        userRepository.count({ where: { username } }).then(async (userExists: number) => {
            if (userExists > 0) {
                res.status(StatusCodes.CONFLICT).json(
                    new ReturnMessages('error',
                        StatusCodes.CONFLICT,
                        ErrorMessages.USER_ALREADY_EXISTS,
                        null));
                return;
            }

            const user: User = new User(req);

            userRepository.save(user)
                .then(() => {
                    user.deletePassword();
                    res.json(user);
                })
                .catch((error: Error) => {
                    logger.error(error);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
                        new ReturnMessages('error',
                            StatusCodes.INTERNAL_SERVER_ERROR,
                            error.message,
                            error.stack));
                });
        }).catch((error: Error) => {
            console.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                new ReturnMessages('error',
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    error.message,
                    error.stack));
        });
    }

    public get(req: Request, res: Response): void {
        const repository: Repository<User> = AppDataSource.getRepository(User);
        const logger = log4js.getLogger();

        logger.debug(req.query);

        repository.createQueryBuilder('user').loadAllRelationIds()
            .orderBy('"username"').getMany().then(async (arrUser: Array<User>) => {
                let promDelPasswd: Array<Promise<void>> = arrUser.map(async (user: User) => {
                    await user.deletePassword();
                })

                await Promise.all(promDelPasswd);

                let items = {
                    "hasNext": false,
                    "items": arrUser
                }

                logger.debug(items);

                res.json(items);
            }).catch((error: Error) => {
                logger.error(error);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                    new ReturnMessages('error',
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        error.message,
                        error.stack));
            });
    }

    public delete(req: Request, res: Response): void {
        let repository: Repository<User> = AppDataSource.getRepository(User);
        const logger = log4js.getLogger();
        const id: number = parseInt(req.params.id);

        logger.info('Excluindo o usuario com ID: ' + id);
        logger.debug('Usuario autenticado: ' + req.userId);

        if (req.userId == id) {
            res.status(StatusCodes.BAD_REQUEST).send(
                new ReturnMessages('error',
                    StatusCodes.BAD_REQUEST,
                    ErrorMessages.USER_CANNOT_SELF_DELETE,
                    null));
            return;
        }

        repository.delete(id)
            .then((result: DeleteResult) => {
                logger.debug(result);
                res.send();
            })
            .catch((error: QueryFailedError) => {
                logger.error(error);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                    new ReturnMessages('error',
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        error.message,
                        error.stack));
            });
    }

    public changePasswd(req: Request, res: Response): void {
        let repository: Repository<User> = AppDataSource.getRepository(User);
        const logger = log4js.getLogger();
        const id: number = req.userId;
        const newPasswd: string = req.body.newPassword;

        if (!newPasswd) {
            res.status(StatusCodes.BAD_REQUEST).json(
                new ReturnMessages('error',
                    StatusCodes.BAD_REQUEST,
                    ErrorMessages.MISSING_MADATORY_FIELD,
                    null));
            return;
        }

        repository.findOneOrFail({ where: { id: id } }).then((user: User) => {
            user.setPassword(newPasswd, false);
            user.passwordResetFlag = false;

            repository.save(user);

            logger.info('Senho do usuario [' + user.username + '] alterada');

            res.status(StatusCodes.NO_CONTENT).send();
        }).catch((error) => {
            logger.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                new ReturnMessages('error',
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    error.message,
                    error.stack));
        });
    }

    public resetPassword(req: Request, res: Response): void {
        let repository: Repository<User> = AppDataSource.getRepository(User);
        const logger = log4js.getLogger();
        const username: string = req.body.email;

        logger.info('Reset de senha solicitado para o usuario [' + username + ']');

        repository.findOneOrFail({ where: { username } }).then((user: User) => {
            user.generateNewPassword();

            repository.save(user);

            logger.info('Senho do usuario [' + user.username + '] resetada');

            res.status(StatusCodes.NO_CONTENT).send();
        }).catch((error) => {
            if (error.name == 'EntityNotFound') {
                logger.warn('Usuario [' + username + '] nao encontrado');
                // Caso nao encontre o usuario, retorna sucesso para nao indicar usuarios invalidos
                res.status(StatusCodes.NOT_FOUND).send(
                    new ReturnMessages('error',
                        StatusCodes.NOT_FOUND,
                        ErrorMessages.USER_NOT_EXISTS,
                        'Usuário: ' + username));
            } else {
                logger.error(error);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                    new ReturnMessages('error',
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        error.message,
                        error.stack));
            }
        });
    }
}

export default new UserController();