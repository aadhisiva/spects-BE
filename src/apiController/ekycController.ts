/**
 * Name: Aadhi siva panjagala
 * Author: aadhisivapanjagala@gmail.com
 * File: controlling for routes
 * created: [2023-05-10]
 * last Modified: [2023-08-31]
 * Project: Spectacles Distribution
 */

import Container from 'typedi';
import express, { Request, Response } from 'express';
import { RESPONSEMSG, RESPONSE_EMPTY_DATA, ResponseCode, ResponseMessages } from '../utility/statusCodes';
import { EkycServices } from '../apiServices/ekycServices';
import { requestAndResonseTime } from '../utility/middlewares';
import path from 'path';

const router = express.Router();

const ekycServices = Container.get(EkycServices);

router.post("/edcs_service", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = req.body;
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
router.post("/demoAuthResponse", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = req.body;
        console.log("data", data)
        // let result = await ekycServices.demoAuthResponse(data);
        // let response = (result?.code || result instanceof Error) ?
        //     ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
        //     ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.INSERT_SUCCESS, result);
        res.send(data);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.get("/edcs_service_application", async (req: Request, res: Response) => {
    try {
        res.sendFile(path.join(__dirname+ "../../views", "ekycApplication.html"));
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

export default router;