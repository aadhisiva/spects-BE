import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import {
  login_user_data, students_data, school_data, ekyc_data, other_benf_data,
  external_logs, master_data, district_data, taluka_data, rc_data, sub_centre_data, redirection_data, Session
} from "../entity";
import { state_data } from "../entity/state_data";

dotenv.config();

// export const AppDataSource = new DataSource({
//   type: "mssql",
//   host: "EC2AMAZ-SAK67N1",
//   port: 1433,
//   username: "sa",
//   password: "edcs@123",
//   database: "spectacles",
//   entities: [login_user_data, school_data, students_data, other_benf_data, ekyc_data,
//     external_logs, rc_data, master_data, sub_centre_data, district_data, taluka_data,
//     state_data, redirection_data
//   ],
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
  entities: [login_user_data, school_data, students_data, other_benf_data, ekyc_data,
    external_logs, rc_data, master_data, sub_centre_data, district_data, taluka_data,
    state_data, redirection_data, Session
  ],
  logging: false,
  synchronize: true,
})

