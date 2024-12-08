import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jsonwebtoken from 'jsonwebtoken';
import log4js from 'log4js';
import AppDataSource from '../database/db_config';
import { ReturnMessages } from '../models/ReturnMessages';
import { User } from '../models/User';
import { ErrorMessages } from '../util/ErrorMessages';

export default function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authorization: string | undefined = req.headers.authorization;
    const logger = log4js.getLogger();

    AppDataSource.getRepository(User).count().then((qtdUsers: number) => {
        if (!authorization) {
            if (qtdUsers == 0 && req.route.path == '/user') {
                logger.warn('Nenhum usuario encontrado na base. Permitindo a criacao de usuario sem estar autenticado');
                next();
            } else {
                res.status(StatusCodes.UNAUTHORIZED).send(
                    new ReturnMessages('error',
                        StatusCodes.UNAUTHORIZED,
                        ErrorMessages.NO_TOKEN_PROVIDED,
                        null));
            }
        } else {
            const token: string = authorization.replace('Bearer', '').trim();

            if (!process.env.API_SECRET) {
                throw new Error('API_SECRET is not defined');
            }

            jsonwebtoken.verify(token, process.env.API_SECRET, (err: jsonwebtoken.VerifyErrors | null, decoded: any) => {
                if (err) {
                    logger.error(err);
                    res.status(StatusCodes.UNAUTHORIZED).send(
                        new ReturnMessages('error',
                            StatusCodes.UNAUTHORIZED,
                            err.message,
                            err.stack));
                } else {
                    logger.debug(decoded);
                    req.userId = decoded.id;
                    next();
                }
            });
        }
    }).catch((error: Error) => {
        logger.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
            new ReturnMessages('error',
                StatusCodes.INTERNAL_SERVER_ERROR,
                error.message,
                error.stack));
    });
}