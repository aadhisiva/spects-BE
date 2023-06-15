import Container from 'typedi';
import express, { Request, Response } from 'express';
import Logger from '../utility/winstonLogger';
import {  RESPONSEMSG, RESPONSE_EMPTY_DATA, ResponseCode, ResponseMessages } from '../utility/statusCodes';
import { hittingTime } from '../utility/trackerLog';
import { EkycServices } from '../apiServices/ekycServices';

const router = express.Router();

const ekycServices = Container.get(EkycServices);

router.post("/edcs_service", async (req: Request, res: Response) => {
    try {
        console.log(req);
        console.log(res);
        return res.send({message: "saved resposen"})
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/edcs_service_application", async (req: Request, res: Response) => {
    try {
        let data = new req.body;
        let result = await ekycServices.createApplication(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.INSERT_SUCCESS, result)
        res.send(response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

export default router;