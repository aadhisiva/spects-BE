import express, { Request, Response } from 'express';
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
import { addData, decrypt, decryptFront } from './utility/resusableFun';

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
// console.log(decrypt("wInAF5ThdK2V8QzFRigvjsSOHMeV9+Pr362Y38Gc/649SAxc5GY0n+j8KhCcI2pDM9Em1v66r33hekK4ULabcutQ6fim+z8zLjnLTXjDmJ7EITRBh/en0+CucmT4i2rQzyAzyYj8HzWWHkEaVIyzonwTTjJt0+SKwgC5MuRecLqMqPdggiuy2O1IpS1F09j3YNSl3hn3r2d7lnBAr3JAnJwy24TickZX8ujfDqqq1L0uzjtrYbdxuMDpIPWLNr1WGbRJw81yJEP5HlFDDVOH7+vCmSurHAt9EUTWAsh+s7Sdqb9gO7ExKiBWYz47AeBthb1HcDMiAyS6ljADB5yHc5WbnZYu/KBzquaT0D7gepbFseduGY9OtMAVM6HMFxJ2ZHmdGV1mQjLOuYaN5jJpcFNJRISzs7Nx3zKk6TiGFrjCrgL4TsiMcPZmZPoVXmj/iZvI6JPeBWLH8VEwm0J3y30s6G44L2DLiqqeDJ0sHBRCRnGzy8wNu40TzuqpZkPMuLSGI/c7Q1ExADAy5hnx+NGJ2FJCzsNTJHCrL0OnpLJv+QQbpDs+hfl5m3l13RI95HhgvB4ldX2Xv+f9GxIH6m+g9TTcqMsSJdREAvhpJ82nBQBTul5mS5JB5EKYii+fQh64B3p1EwGh5QNgpKpkD9Br74Q4N2rtSYrSw6+th7DhQJfw+TNYbLymleOrSNo0WWcmyhq0UYb4XNE/dew4OPP/9/+0GvcwXSiosyY62WVg7ABCvkME48pey0SdxwvpMRooRkoydOY2UcCrf6muIA86PhOrYjIrFelZl+bGdHLdmmTC4UD9pZKKwx4t/F74A0yL9zf62J+yq/PvjVa7KadANI7MpiFxk5DnN01zgGl1alteEBkoj/DnA36ZulYl3SuOZaZvCW8egMtyE0NoXKMhJ51QuYkId8sp5ODm/Jm7kHF3n6y0jAs/uI2yD0SBjDDuAFG3eu2DPMNTTnVKAFtgAL9QdCowKfrpF/wis8xj7H3unPQOrHTIuQFRmuyicNepg7usHUaUND4zrPA8Zw=="))

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

