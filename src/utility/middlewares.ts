import { trackExternalLogs } from "./trackerLog";
const jwt = require("jsonwebtoken");
import Logger from "./winstonLogger";

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