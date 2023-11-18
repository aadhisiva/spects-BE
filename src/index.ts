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
import { aadharToHash, checkEligableCandiadate, createUniqueIdBasedOnCodes, decrypt } from './utility/resusableFun';
import sessions from "express-session";
import { TypeormStore } from "typeorm-store";
import { Session } from './entity';
import path from 'path';

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
// const twoHour = 1000 * 10;

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
  let {no} = req.body;
  // let data = await checkEligableCandiadate("Kalaburgi".toLowerCase(), 'Kalaburgi'.toLowerCase());
  // let data = await createUniqueIdBasedOnCodes('2023_8395', 'school')
  let aadhar = await aadharToHash(no)
  res.send(aadhar)
});

// console.log(decrypt("4MID53Z+xI8G/1WBM8m2liX1V9JNvotuuSmzzz20Cso5ejfj0Jdfl6Eknp1XQFUoMQi1xdYNay+gYozwbLCnI0WNuzq6noXWzNMcCZC+PEX5s5U77q4D5W/ObEdWjtOLJQWeCYHHAFDGn/LdtPxDZ1ANUHg/cfBiv3TsP4+LcxbspChyH5MufLTzG/bmruuWDu+GqEhlSWA7pFUsC55qkcfZCwXOw/spg+xqRfc0JPV4WaEv9rKSYoRNowjF5PX3gjjtWLOz3LzbEACgN9+lEBMatydVBks640H75kGOwAk="));

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

