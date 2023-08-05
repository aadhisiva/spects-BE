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
import { addData } from './utility/resusableFun';
import path from 'path';
import sessions from "express-session";
import { TypeormStore } from "typeorm-store";
import { Session } from './entity';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ["POST", "GET"],
  credentials: true,
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

let repository = AppDataSource.getRepository(Session);

// time milliseconds * seconds * minutes * hours
const twoHour = 1000 * 60 * 60 * 2;

// production
// secret: process.env.COOKIE_PARSER_KEY,
//   saveUninitialized: true,
//   cookie: {
//     secure: true, // This will only work if you have https enabled!
//     httpOnly: true,
//     maxAge: twoHour,
//   },
//   store: new TypeormStore({ repository }),
//   resave: false,

//session middleware
app.use(sessions({
  secret: process.env.COOKIE_PARSER_KEY,
  saveUninitialized: true,
  cookie: { maxAge: twoHour },
  store: new TypeormStore({ repository }),
  resave: false,
}));

app.use(function(req, res, next){
  req.headers['X-Frame'] = 'SAMEORIGIN';
  req.headers['Content-Security-Policy'] = '<policy-directive>; <policy-directive>';
  req.headers['X-XSS-Protection'] = '1; mode=block';
  req.headers['X-Content-Type-Options']= 'nosniff';
  req.headers['strict-transport-security'] = 'max-age=63072000; includeSubdomains; preload';
  req.headers['content-type']= 'application/json; charset=utf-8'
  res.header("X-Frame", "SAMEORIGIN");
  res.header("X-XSS-Protection", "1; mode=block'");
  res.header("X-Content-Type-Options", "nosniff");
  res.header("strict-transport-security", "max-age=63072000; includeSubdomains; preload");
  res.header('Content-Security-Policy', '<policy-directive>; <policy-directive>')
  next();
})

app.use(morgan('common', {
  stream: fs.createWriteStream('./logs/application.log', { flags: 'a' })
}));
// Have Node serve the files for our built React app
// app.use(express.static(path.resolve(__dirname, '../../../build')));

// Set directory to contain the templates ('views')
app.set('views', __dirname);



// Set view engine to use
app.set('view engine', 'ejs');
app.use(morgan('dev'));

app.post("/add", async (req, res) => {
  let data = addData();
  res.send(data)
});

// All other GET requests not handled before will return our React app
// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname, '../../../build', 'index.html'));
// });

app.use("/login", UserController);
app.use("/school", SchoolController);
app.use("/other", OtherBenfController);
app.use("/edcs", EkycController);
app.use("/admin", AdminController);

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

