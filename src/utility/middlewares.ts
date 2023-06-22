import { trackExternalLogs } from "./trackerLog";
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
        Logger.error(" middlewares ===============", e);
    }
};