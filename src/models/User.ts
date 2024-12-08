import { Request } from 'express';
import { Entity, PrimaryGeneratedColumn, Column, Index, UpdateDateColumn, CreateDateColumn } from 'typeorm';
import bcryptjs from 'bcryptjs';
import { Constants } from '../util/Constants';
import { generate } from 'generate-password';
import log4js from 'log4js';
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import * as nodemailer from "nodemailer";

@Entity('users')
export class User {

    @PrimaryGeneratedColumn()
    public id: number;

    @Index('idx_username', { unique: true })
    @Column({ type: 'text', nullable: false })
    public username: string;

    @Column({ type: 'text', nullable: false })
    private password?: string;

    @Column({ type: 'integer', nullable: false, default: Constants.MAX_LOGIN_ATTEMPTS })
    public remainingLoginAttempts: number;

    @Column({ type: 'datetime', default: null })
    public lastLoginAttempt: Date;

    @Column({ type: 'datetime', default: null })
    public lastLogin: Date;

    @Column({ type: 'boolean', default: false, nullable: false })
    public isAdmin: boolean;

    @CreateDateColumn()
    private createdDate: Date;

    @UpdateDateColumn()
    private lastModifiedDate: Date;

    @Column({ type: 'datetime', nullable: false })
    public lastPasswordChange: Date;

    @Column({ type: 'boolean', default: true, nullable: false })
    public passwordResetFlag: boolean;

    public token: string;

    constructor(req: Request) {
        if (!req) {
            return;
        }

        this.username = req.body.username;

        if (req.body.password) {
            this.setPassword(req.body.password, false);
        } else {
            this.generateNewPassword();
        }

        if (req.body.isAdmin != undefined) {
            this.isAdmin = req.body.isAdmin;
        }
    }

    public generateNewPassword() {
        let passwd = generate({ length: 15, numbers: true, strict: true, excludeSimilarCharacters: true });
        this.setPassword(passwd, true);
        this.passwordResetFlag = true;
    }

    public setPassword(passwd: string, sendEmail: boolean): void {
        const logger = log4js.getLogger();

        if (sendEmail) {
            this.sendPasswdEmail(passwd);
        }

        this.password = bcryptjs.hashSync(passwd);
        this.lastPasswordChange = new Date();
    }

    public getPassword(): string {
        return this.password ? this.password : "";
    }

    public deletePassword(): void {
        delete this.password;
    }

    private sendPasswdEmail(passwd: string): void {
        const logger = log4js.getLogger();
        let subject: string = '[HabituTrack] Recupere seu acesso';
        let message: string = '<b>Olá,</b><div><br></div><div>' +
            'Seguem as informações para recuperar seu acesso ao HabituTrack.</div><div><br></div><div>' +
            '<b>Usuário/Login:</b> ' + this.username + '</div><div>' +
            '<b>Senha Temporária:</b> ' + passwd + '</div><div><br></div><div>' +
            '<b><font color="#ff0000">Atenção:</font></b> A senha de acesso gerada é de uso temporário. ' +
            'Para a sua segurança, solicitamos que realize a alteração após acessar o sistema. ' +
            'A senha gerada expira em <font color="#ff0000"><b>' + Constants.HOURS_EXPIRE_TMP_PASSWD + ' horas</b></font>, caso não seja alterada.</div>';

        let mailOptions = {
            from: "contato@habitutrack.com.br",
            to: this.username,
            subject: subject,
            html: message
        };

        const smtpConfig: SMTPTransport.Options = {
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT),
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWD
            }
        };

        let transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>;

        transporter = nodemailer.createTransport(smtpConfig);

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                logger.error(error);
                return error;
            } else {
                logger.debug('E-mail com a senha enviado para [' + this.username + ']');
                return 'E-mail enviado com sucesso!';
            }
        });
    }
}
