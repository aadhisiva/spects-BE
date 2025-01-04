/**
 * Name: Aadhi siva panjagala
 * Author: aadhisivapanjagala@gmail.com
 * File: for db connection
 * created: [2023-11-04]
 * Project: waterShead
 */

import "reflect-metadata";
import { DataSource } from "typeorm";
import { allEntities } from "./entities";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mssql",
  host: String(process.env.PRO_DB_HOST),
  port: Number(process.env.PRO_DB_PORT),
  username: process.env.PRO_DB_USERNAME,
  password: process.env.PRO_DB_PASSWORD,
  database: process.env.PRO_DB_DATABASE,
  entities: allEntities,
  logging: false,
  synchronize: false,
  options: {
    encrypt: true, // For Azure SQL or if encryption is needed
    trustServerCertificate: true // Set to true if you encounter issues with certificate validation
  },
  pool: {
    max: 10, // Maximum number of connections in the pool
    min: 0,  // Minimum number of connections in the pool
    idleTimeoutMillis: 30000 // Time (in ms) to keep idle connections in the pool
  },
  connectionTimeout: 15000, // Connection timeout in milliseconds
  requestTimeout: 30000
});




