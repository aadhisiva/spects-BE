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
import { addData, decrypt } from './utility/resusableFun';
import sessions from "express-session";
import { TypeormStore } from "typeorm-store";
import { Session } from './entity';

// for acceessing env variables
dotenv.config();

// express adding sever to app
const app = express();

// setting port num from env
const port: any = process.env.PORT || 3000;

// used for body parsers in apis
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// session creation for client side
let repository = AppDataSource.getRepository(Session);

// time milliseconds * seconds * minutes * hours
const twoHour = 1000 * 60 * 60 * 2;

// check node is running on production or not
let secure = process.env.NODE_ENV == "production" ? true : false;
let setOrigin = process.env.NODE_ENV == "production" ? process.env.NODE_PRO : process.env.NODE_DEV;

// cors setup for communication of sever and client
app.use(cors({
  origin: ["http://localhost:3000"],
  methods: ["POST", "GET"],
  credentials: true,
}));

//session middleware
app.use(sessions({
  secret: process.env.COOKIE_PARSER_KEY,
  saveUninitialized: false, // it is maintaining same session id in same browser at every time
  cookie: {
    maxAge: twoHour, // max age set in milliseconds
    secure, // secure true is only works in https - rememeber this
    // sameSite: true // protection against a variety of cross-site attacks, including CSRF, cross-site leaks, and some CORS exploits.
  },
  store: new TypeormStore({ repository }),
  resave: false,
  name: "user"
}));

//setting req headers and res headers 
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

// Set directory to contain the templates ('views')
app.set('views', __dirname);

// Set view engine to use
app.set('view engine', 'ejs');
app.use(morgan('dev'));

// add masters data
app.post("/add", async (req, res) => {
  let data = addData();
  res.send(data)
});

console.log(decrypt("BXYUyLhLowdqgeJRfG8VUQq9Uw6RqBWtHNik+o8JaX9FSvhlUYChLWI3Ly9YybP95Q18a7n4fFcY5cGEs5Eu/fXMKCHxXS5Zwn7AFqb7Y2lBDHcszB08tdEjxy56M09+xcPOUyL4B36ITAs147PZMwVsz4xVMQGQfIO1ste4T0g7QbdjUANAq7NRSeUNBsdooQ//KJvzoKjOnTNejcVJL+ltauhFEKxnUK73pYwjbpNiIaKVFA1QGnHwVTcXtQ0WR2+cSPoEtNniZosSbLA3/cb1eeR2Dja9tDJQh0IT9qhffGJaY46z/GrzeStESnPgE67judMpdpgo60sY8i5N82lkL9lVMpD4v+j7PkDpQ24ikyQ3B5nEnOUjiZsTMUSbGO5hCjB9zoZV2+T4xVDExQKzX+8zzxxixZPHac81BnWfEprjMpWjt+u+540NYAL/xsNSiEd7YWJmftbxD/qfsTvowUWKCO3vgjP/xvuRZjZH/mO44PuXSSLzCZ7RBNoykpZKkIJezQIa9osglyNfAxmDIRn6f1/x1Y1h1V4Pbj+4KmRbPkCcQsmGlTxW7xWNLBnY2Jdqy07F0HscuBI3luUFBTmSPj+VaYeR4D8qvWQcSnynlcQeYBH1RVocvcQP9Rki1YMXOKgcxKzaAHRw9wlCUGiQfyZa23qFryPIZC2k+UYoPwpWxIjXktllCykZYDQ7ohXxHp9rAgB4xTy5L9NsQWOsFtGMSbmVvbC+ANJD2Y99E6q13iDAoAmMAumCxJJTwuizKkOshFvq0e56uX+2ZH18BoU8g5gpflIADScHaJHiHtCROKflsa77N19vX/ePmYQopdzpRwOFcFjOFMM8Fv/zTQF7/7wox8PIXtTAu+JhQpbNPkf1O9/qfLPy7aCAtTv5dPyf8TtJaw74PT846arnAoss4OhL/RKyKeJ187XqtuK29BJA/pffGuDRG1tnkbhhUpHsWqzJ/v/komV0qCbYIdGByaNRRNcplvU="))

// controllers for routes
app.use("/login", UserController);
app.use("/school", SchoolController);
app.use("/other", OtherBenfController);
app.use("/edcs", EkycController);
app.use("/admin", AdminController);

// we are adding port connection here
app.listen(port, async () => {
  let connection = await AppDataSource.initialize();
  if (connection instanceof Error) {
    Logger.error("connection error :::::::", connection);
    throw new Error(JSON.stringify(connection));
  } else {
    Logger.info(`⚡️[Database]: Database connected....`);
  }
  Logger.info(`⚡️[server]: Server is running at ${port}`);
});

