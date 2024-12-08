import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import AppDataSource from '../database/db_config';
import { User } from '../models/User';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import { ErrorMessages } from '../util/ErrorMessages';
import { Constants } from '../util/Constants';
import { ReturnMessages } from '../models/ReturnMessages';
import log4js from 'log4js';

class AuthController {
    public authenticate(req: Request, res: Response): void {
        const repository = AppDataSource.getRepository(User);
        const username: string = req.body.username;
        const password: string = req.body.password;
        const logger = log4js.getLogger();

        logger.info("Inicio da autenticacao para o usuario [" + username + "]");

        repository.findOne({ where: { username } }).then((user: User | null) => {
            if (!user) {
                res.status(StatusCodes.UNAUTHORIZED).json(
                    new ReturnMessages('error',
                        StatusCodes.UNAUTHORIZED,
                        ErrorMessages.INVALID_USER_PASSWD,
                        "")
                );
                return;
            }

            if (user.lastLoginAttempt == null) {
                user.lastLoginAttempt = new Date();
            }

            let yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (user.remainingLoginAttempts == 0 &&
                user.lastLoginAttempt.getTime() >= yesterday.getTime()) {
                res.status(StatusCodes.FORBIDDEN).json(
                    new ReturnMessages('error',
                        StatusCodes.FORBIDDEN,
                        ErrorMessages.BLOCKED_USER,
                        'Data do bloqueio: ' + user.lastLoginAttempt.toLocaleString('pt-BR'))
                );
                return;
            } else if (user.lastLoginAttempt.getTime() < yesterday.getTime()) {
                user.remainingLoginAttempts = Constants.MAX_LOGIN_ATTEMPTS;
            }

            bcryptjs.compare(password, user.getPassword()).then((isValid: boolean) => {
                if (!isValid) {
                    user.remainingLoginAttempts--;
                    user.lastLoginAttempt = new Date();
                    repository.save(user);

                    if (user.remainingLoginAttempts == 0) {
                        res.status(StatusCodes.FORBIDDEN).json(
                            new ReturnMessages('error',
                                StatusCodes.FORBIDDEN,
                                ErrorMessages.BLOCKED_USER,
                                'Data do bloqueio: ' + user.lastLoginAttempt.toLocaleString('pt-BR')));
                    } else {
                        let msg: ReturnMessages = new ReturnMessages('error',
                            StatusCodes.UNAUTHORIZED,
                            ErrorMessages.INVALID_USER_PASSWD,
                            'Tentativas de login restantes: ' + user.remainingLoginAttempts);
                        msg.remainingLoginAttempts = user.remainingLoginAttempts

                        res.status(StatusCodes.UNAUTHORIZED).json(msg);
                    }

                    return;
                }

                let passwdDateExpiration: Date = user.lastPasswordChange;

                if (user.passwordResetFlag == true) {
                    passwdDateExpiration.setHours(passwdDateExpiration.getHours() + Constants.HOURS_EXPIRE_TMP_PASSWD);
                } else {
                    passwdDateExpiration.setDate(passwdDateExpiration.getDate() + Constants.DAYS_EXPIRE_PASSWD);
                }

                if (passwdDateExpiration.getTime() <= new Date().getTime()) {
                    res.status(StatusCodes.FORBIDDEN).json(
                        new ReturnMessages('error',
                            StatusCodes.FORBIDDEN,
                            ErrorMessages.EXPIRED_PASSWORD,
                            'Data da expiração: ' + passwdDateExpiration.toLocaleString('pt-BR'))
                    );
                    return;
                }

                // Zera tentativas de login com erro
                user.remainingLoginAttempts = Constants.MAX_LOGIN_ATTEMPTS;
                user.lastLoginAttempt = new Date();
                user.lastLogin = new Date();
                repository.save(user);

                user.deletePassword();

                if (!process.env.API_SECRET) {
                    throw new Error('API_SECRET is not defined');
                }

                user.token = jsonwebtoken.sign({ id: user.id }, process.env.API_SECRET, { expiresIn: "1d" });

                res.json({ user });
            });
        }).catch((error: Error) => {
            logger.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
                new ReturnMessages('error',
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    error.message,
                    error.stack)
            );
        });
    }
}

export default new AuthController();