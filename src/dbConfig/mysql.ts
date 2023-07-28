import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { entities } from "../entities";

dotenv.config();

// export const AppDataSource = new DataSource({
//   type: "mssql",
//   host: process.env.PRO_DB_HOST,
//   port: Number(process.env.PRO_DB_PORT),
//   username: process.env.PRO_DB_USERNAME,
//   password: process.env.PRO_DB_PASSWORD,
//   database: process.env.PRO_DB_DATABASE,
//   entities: entities(),
//   logging: false,
//   synchronize: true,
//   options: {
//     encrypt: false,
//     useUTC: true,
//   },
//   pool: {
//     max: 100,
//     min: 0,
//     idleTimeoutMillis: 3600000,
//   },
// });

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: entities(),
  logging: false,
  synchronize: true,
})

