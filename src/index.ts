/**
 * Name: Aadhi siva panjagala
 * Author: aadhisivapanjagala@gmail.com
 * File: Main file for creating server -- index.ts
 * created: [2023-05-10]
 * last Modified: [2023-08-07]
 * Project: Spectacles Distribution
 */

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

// for acceessing env variables
dotenv.config();

// express adding sever to app
const app = express();

// setting port num from env
const port: any = process.env.PORT || 3000;

// used for body parsers in apis
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// time milliseconds * seconds * minutes * hours

// cors setup for communication of sever and client
const corsOptions = {
  origin: ['https://spectacles.karanataka.gov.in', "http://localhost:3000"], // Your React app domain
  credentials: true
};

app.use(function (req, res, next) {
  res.header("X-Frame-Options", "SAMEORIGIN");
  res.header("X-XSS-Protection", "1; mode=block'");
  res.header("X-Content-Type-Options", "nosniff");
  res.header("strict-transport-security", "max-age=63072000; includeSubdomains; preload");
  res.header('Content-Security-Policy', '<policy-directive>; <policy-directive>')
  next();
})

// create for logs 
app.use(morgan('common', {
  stream: fs.createWriteStream('./logs/application.log', { flags: 'a' })
}));

app.use(cors(corsOptions));


app.get("/edcs/run", (req, res) => {
  res.send("Running Successfully");
})

// controllers for routes
app.use("/edcs/login", UserController);
app.use("/edcs/school", SchoolController);
app.use("/edcs/other", OtherBenfController);
app.use("/edcs", EkycController);
app.use("/edcs/admin", AdminController);
// Set directory to contain the templates ('views')
app.set('views', __dirname);

// Set view engine to use
app.set('view engine', 'ejs');
app.use(morgan('dev'));


// we are adding port connection here
AppDataSource.initialize().then(async (connection) => {

  app.listen(port, () => {
    Logger.info(`⚡️[Database]: Database connected....+++++++ ${port}`);
  });
}).catch(error => {
  Logger.error("connection error :::::::", error);
  throw new Error("new Connection ERROR " + JSON.stringify(error));
})
