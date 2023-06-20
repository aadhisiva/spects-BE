import { Container } from 'typedi';
import express, { Request, Response } from 'express';
import Logger from '../utility/winstonLogger';
import { UserServices } from '../apiServices/userServices';
import { login_user_data } from '../entity/login_user_data';
import { RESPONSEMSG, RESPONSE_EMPTY_DATA, ResponseCode, ResponseMessages } from '../utility/statusCodes';
import { hittingTime } from '../utility/trackerLog';
import { encryptData } from '../utility/resusableFun';

const router = express.Router();

const userServices = Container.get(UserServices);


router.post('/login', async (req: Request, res: Response) => {
    try {
        const hitting = hittingTime();
        let tableData = new login_user_data(req.body);
        const result = await userServices.postUser(tableData, hitting);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("UserController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post('/new_user', async (req: Request, res: Response) => {
    try {
        // const hitting = hittingTime();
        let tableData = new login_user_data(req.body);
        const result = await userServices.addUser(tableData);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), result.data);
        res.send(response);
    } catch (e) {
        Logger.error("UserController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/validate_otp", async (req: Request, res: Response) => {
    try {
        const hitting = hittingTime();
        let data = new login_user_data(req.body);
        let result = await userServices.validateUser(data, hitting);
        let response = (result?.code || result instanceof Error) ?
        ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
        ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), encryptData(result?.data));
        res.send(response);
    } catch (e) {
        Logger.error("UserController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/resend_otp", async (req: Request, res: Response) => {
    try {
        const hitting = hittingTime();
        let data = new login_user_data(req.body);
        let result = await userServices.resendOtp(data, hitting);
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