import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import Logger from "./utility/winstonLogger";
import fs from "fs";
import cors from "cors";
import { AppDataSource } from "./dbConfig/mysql";
import UserController from "./apiController/userController";
import SchoolController from "./apiController/schoolController";
import OtherBenfController from "./apiController/otherBenController";
import EkycController from "./apiController/ekycController";
import AdminController from "./apiController/adminController";
import { addData, decrypt } from './utility/resusableFun';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(morgan('common', {
  stream: fs.createWriteStream('./logs/application.log', { flags: 'a' })
}));
// Set directory to contain the templates ('views')
app.set('views', __dirname);

// Set view engine to use
app.set('view engine', 'ejs');
app.use(morgan('dev'));
// console.log(decrypt("eosVizk9aPfgFdifuSYn89wdyIRWC69KMy9Vu1zfw6MA7D5zcFw+IRvIiPPAvtrhnNZy6xw7CbWDX9tsnw/hPKEHW2nVdMBqnc+KtjcB8dbV8XwBk2vbwTzZKakDa8Qp7P/Nxfbak7DJiSUoOTMVA0MqnNQvjNuZsMw/8yh9MYa1hztbrkOAdyDk1buzJHjVe3qpNEvPvKqdHcIU5D9CRZHTmDrdUkPcOy0h4QRuYNgBOra8VWm2ZAyvdHeht+YxkwUOdHMUbOKsB6XZHHpJ4w=="))

app.post("/add", async (req, res) => {
  let data = addData();
  res.send(data)
});

app.use("/login", UserController);
app.use("/school", SchoolController);
app.use("/other", OtherBenfController);
app.use("/edcs", EkycController);
app.use("/admin", AdminController);

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

