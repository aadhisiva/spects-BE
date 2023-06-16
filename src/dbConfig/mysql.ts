import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { login_user_data, students_data, school_data, tracker_data, ekyc_data } from "../entity";
import { other_benf_data } from "../entity/other_benf_data";

dotenv.config();

// export const AppDataSource = new DataSource({
//   type: "mssql",
//   host: "EC2AMAZ-SAK67N1",
//   port: 1433,
//   username: "sa",
//   password: "edcs@123",
//   database: "spectacles",
//   entities: [login_user_data, school_data, students_data, other_benf_data, tracker_data, ekyc_data],
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
  entities: [login_user_data, school_data, students_data, other_benf_data, tracker_data, ekyc_data],
  logging: false,
  synchronize: true,
});

