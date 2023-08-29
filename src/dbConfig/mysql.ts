/**
 * Name: Aadhi siva panjagala
 * Author: aadhisivapanjagala@gmail.com
 * File: controlling for routes
 * created: [2023-05-10]
 * last Modified: [2023-08-07]
 * Project: Spectacles Distribution
 */

import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { entities } from "../entities";

dotenv.config();

export const AppDataSource= new DataSource({
  type: "mssql",
  // host: "EDCS-DB-VP22",
  host: "LAPTOP-D97QEO1R",
  port: Number(process.env.PRO_DB_PORT),
  username: process.env.PRO_DB_USERNAME,
  password: process.env.PRO_DB_PASSWORD,
  database: process.env.PRO_DB_DATABASE,
  entities: entities(),
  logging: false,
  synchronize: true,
  options: {
      encrypt: false,
      useUTC: true,
  },
  pool: {
      max: 100,
      min: 0,
      idleTimeoutMillis: 3600000,
  },
});




