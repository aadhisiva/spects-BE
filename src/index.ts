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
import { addData, decrypt } from './utility/resusableFun';

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
// console.log(decrypt("6GXg0plJJXptXwHhjccEDXTOYyK0aXfz00C4RT35Wwe8nh9FHMZCEzzZakvsXdCdgrII2dT4k/Bv29OyFVxldzENInBzQUuGaPHYK6LF+9QQA6oOisi9mVQBTt56rk24x0KFGzmJEsWN21W0pz7y7X9sNmsdf5laWRNcSa/VSw1MWG6nNkBr9fEDqHtMkXk4UvpKL94ju5fBCVL4Eq65bYFPVUGy7+H4eIwMhlkeuU2hDcTvfzkf2li7kAGGr2dpaIMTt2pElX65ImEN+GXhOSHNd7FVyXIQC1oAOqJ8+BMDzyPJNUOkW6Tej6IRbAvdAkxtO56+0mjdcjNXxVETgjA9EiB0uXlEEyuoZvk3VsYW7bDdbPHwRNIXZab3GWndwny2xM6Qn77gHoejgllBttnVkuMWThCxST/Yr6hbaZZPdrQxAobxZa6VBvI8AwvRoQLcvTl0Tfirxa8HXmoxdELtZcwWvZt6Y0HkAkPoagqMyln5lP4UE62LzXXHxwlQ"))

app.post("/add", async (req, res) => {
  addData();
  res.send("ok")
});

app.use("/login", UserController);
app.use("/school", SchoolController);
app.use("/other", OtherBenfController);
app.use("/edcs", EkycController);

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

