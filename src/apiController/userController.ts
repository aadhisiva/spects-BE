/**
 * Name: Aadhi siva panjagala
 * Author: aadhisivapanjagala@gmail.com
 * File: controlling for routes
 * created: [2023-05-10]
 * last Modified: [2023-08-07]
 * Project: Spectacles Distribution
 */

import { Container } from 'typedi';
import express, { Request, Response } from 'express';
import Logger from '../utility/winstonLogger';
import { UserServices } from '../apiServices/userServices';
import { RESPONSEMSG, RESPONSE_EMPTY_DATA, ResponseCode, ResponseMessages } from '../utility/statusCodes';
import { encryptData } from '../utility/resusableFun';
import { requestAndResonseTime } from '../utility/middlewares';

const router = express.Router();

const userServices = Container.get(UserServices);


router.post('/login', requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let tableData = req.body;
        const result = await userServices.postUser(tableData);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("UserController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/validate_otp", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await userServices.validateUser(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), result?.data);
        res.send(response);
    } catch (e) {
        Logger.error("UserController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/resend_otp", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await userServices.resendOtp(data);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("UserController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

export default router;