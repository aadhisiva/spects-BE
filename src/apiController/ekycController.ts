import Container from 'typedi';
import express, { Request, Response } from 'express';
import {  RESPONSEMSG, RESPONSE_EMPTY_DATA, ResponseCode, ResponseMessages } from '../utility/statusCodes';
import { EkycServices } from '../apiServices/ekycServices';
import fs from "fs";
import path from "path";
import { requestAndResonseTime } from '../utility/middlewares';

const router = express.Router();

const ekycServices = Container.get(EkycServices);

router.post("/edcs_service", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = req.body;
        console.log(req.body)
       await fs.writeFileSync("./text.txt", JSON.stringify(req.body));
       let result = await ekycServices.saveEkycData(data);
       let response = (result?.code || result instanceof Error) ?
       ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
       ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.INSERT_SUCCESS, result);
       res.send(response);

    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.get("/edcs_service_application", async (req: Request, res: Response) => {
    try {
        console.log(path.join(__dirname + "../../webPage/ekyc.html"));
        res.sendFile(path.join(__dirname + "../../views/ekyc_application.html"));
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

export default router;