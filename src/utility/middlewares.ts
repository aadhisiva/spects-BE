import { AppDataSource } from "../dbConfig/mysql";
import { apiVersions, district_data, sub_centre_data, taluka_data } from "../entity";
import { state_data } from "../entity/state_data";
import { trackExternalLogs } from "./trackerLog";
import jwt from "jsonwebtoken";
import Logger from "./winstonLogger";

const sessionUserData = async (data) => {
  try {
    if (data.type == "state_admin") {
      return await AppDataSource.getRepository(state_data).findOneBy({ mobile_number: data.mobile_number });
    } else if (data.type == "district_officer") {
      return await AppDataSource.getRepository(district_data).findOneBy({ mobile_number: data.mobile_number })
    } else if (data.type == "taluka") {
      return await AppDataSource.getRepository(taluka_data).findOneBy({ mobile_number: data.mobile_number })
    } else if (data.type == "subcenter") {
      return await AppDataSource.getRepository(sub_centre_data).findOneBy({ mobile_number: data.mobile_number })
    }
    return AppDataSource.getRepository(district_data)
  } catch (e) {
    throw new Error(e);
  }
};

export const requestAndResonseTime = async function (req, res, next) {
  try {
    var send = res.send;
    res.send = async function (resData) {
      let body = JSON.stringify(req.body);
      let response = JSON.stringify(resData);
      let method = req.method;
      let table = req.originalUrl;
      let type = "";
      let user = req.body?.user_id;
      await trackExternalLogs(table, method, type, body, response, user);
      res.send = send;
      res.send(resData);
    };
    next();
  } catch (e) {
    Logger.error("middlewares ===============", e);
  }
};



export function authenticateToken(req, res, next) {

  // Read the JWT access token from the request header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(401).send("unauthorized"); // Return 401 if no token

  // Verify the token using the Userfront public key
  jwt.verify(token, process.env.USERFRONT_PUBLIC_KEY, (err, auth) => {
    if (err) return res.status(403).send("Forbidden"); // Return 403 if there is an error verifying
    req.auth = auth;
    next();
  });
};


export async function authTokenAndVersion(req, res, next) {

  // Read the JWT access token from the request header
  const authHeader = req.headers["authorization"];
  const authVersion = req.headers["apiversion"];
  if(!authVersion) return  res.status(422).send({code: 422, message: "Api Version Header Missing."})
  let getVersion = await AppDataSource.getRepository(apiVersions).find();
  let checkVersion = authVersion == getVersion[0].version;
  if(!checkVersion) return res.status(422).send({code: 422, message: "Api Version Not Matching"});
  // const token = authHeader && authHeader.split(" ")[1];
  // if (token == null) return res.status(401).send({code: 401, message: "UnAuthorized User"}); // Return 401 if no token

  // Verify the token using the Userfront public key
  // jwt.verify(token, process.env.USERFRONT_PUBLIC_KEY, (err, auth) => {
  //   if (err) return res.status(403).send({ code: 403, message: "Forbidden"}); // Return 403 if there is an error verifying
    // req.auth = auth;
    next();
  // });
};

export function verifyUser(req, res, next) {
  try {
    var session = req?.session;
    if (!session?.user) {
      return res.status(401).json({ msg: "unAuthorized" });
    }
    sessionUserData(session?.user).then(function (obj: any) {
      if (!obj) return res.status(404).json({ msg: "user not exists." });
      req.userId = obj?.unique_id;
    });
    next();
  } catch (e) {
    throw new Error(e);
  }
};
export const validateFeilds = (schema) => async (req, res, next) => {
  try {
    await schema.validate({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (err) {
    return res.status(500).json({ code: 500, status: 'Failed', message: err.message });
  }
};