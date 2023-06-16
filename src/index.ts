import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import Logger from "./utility/winstonLogger";
import fs from "fs";
import { AppDataSource } from "./dbConfig/mysql";
import UserController from "./apiController/userController";
import SchoolController from "./apiController/schoolController";
import OtherBenfController from "./apiController/otherBenController";
import EkycController from "./apiController/ekycController";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use(morgan('common', {
  stream: fs.createWriteStream('./logs/application.log', { flags: 'a' })
}));
// Set directory to contain the templates ('views')
app.set('views', __dirname);

// Set view engine to use
app.set('view engine', 'ejs');
app.use(morgan('dev'));

app.use("/login", UserController);
app.use("/school", SchoolController);
app.use("/other", OtherBenfController);
app.use("/edcs", EkycController);


app.get('/run', (req: Request, res: Response) => {
  Logger.info("Express + TypeScript Server")
  res.send('Express + TypeScript Server');
});

app.listen(port, async () => {
  let connection = await AppDataSource.initialize();
  if (connection instanceof Error) {
    Logger.error("connection error :::::::",connection);
    throw new Error(JSON.stringify(connection));
  } else {
    Logger.info(`⚡️[Database]: Database connected....`);
  }
  Logger.info(`⚡️[server]: Server is running at ${port}`);
});

