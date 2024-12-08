import express from 'express'
import cors from 'cors';
import { Application } from 'express';
import routes from './routes';
import AppDataSource from './database/db_config';
import log4js from 'log4js';
import dotenv from 'dotenv';

dotenv.config();

// Abre arquivo de log
log4js.configure('conf/log4js.json');
const logger = log4js.getLogger();

const app: Application = express();

const port: number = parseInt(process.env.API_PORT!);

const allowedOrigins: string[] = ['http://localhost:8080'];

const options: cors.CorsOptions = {
  origin: allowedOrigins
};

AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!")
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err)
    })

app.use(express.json());
app.use(cors(options));
app.use(routes);

// start the Express server
app.listen(port, () => logger.info('Server started at http://localhost:' + port));