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
import { RESPONSEMSG, RESPONSE_EMPTY_DATA, ResponseCode, ResponseMessages } from '../utility/statusCodes';
import { other_benf_data } from '../entity/other_benf_data';
import { encryptData } from '../utility/resusableFun';
import { rc_data } from '../entity/rc_data';
import { requestAndResonseTime } from '../utility/middlewares';
import { NewOtherBenfServices } from '../apiServices/otherBenfServNew';

const router = express.Router();

const newOtherBenfServices = Container.get(NewOtherBenfServices);
/* new version apis for other beneficiary */

router.post("/addAadharData", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let body = req.body;
        let result: any = await newOtherBenfServices.directEkycForAadhar(body);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/addDataAfterEkyc", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let body = req.body;
        let result: any = await newOtherBenfServices.addDataAfterEkyc(body);
        let response = (result?.code || result instanceof Error) ?
            {code: 422, message: result.message, errorInfo: "", data: {}} :
            {code: 200, message: result.message, errorInfo: result.errorInfo, data: (result.data)};
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/updateAadharData", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let body = req.body;
        let result: any = await newOtherBenfServices.updateAadharData(body);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/addRcData", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let body = new rc_data(req.body);
        let result: any = await newOtherBenfServices.addRcDataAndGet(body);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/throughRcApply", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let body = new other_benf_data(req.body);
        let result: any = await newOtherBenfServices.throughRcApply(body);
        let response = (result?.code || result instanceof Error) ?
        {code: 422, message: result.message, errorInfo: result.errorInfo, data: {}} :
        {code: 200, message: result.message, errorInfo: result.errorInfo, data: (result.data)};
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// router.post("/rcBasedOnNumberWise", requestAndResonseTime, async (req: Request, res: Response) => {
//     try {
//         let body = new other_benf_data(req.body);
//         let result: any = await newOtherBenfServices.rcBasedOnNumberWise(body);
//         let response = (result?.code || result instanceof Error) ?
//             ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
//             ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result?.data));
//         res.send(response);
//     } catch (e) {
//         Logger.error("OtherBenficiary => ", e);
//         return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
//     }
// });
// router.post("/otpCheckRcMember", requestAndResonseTime, async (req: Request, res: Response) => {
//     try {
//         let body = new other_benf_data(req.body);
//         let result: any = await newOtherBenfServices.otpCheckRcMember(body);
//         let response = (result.code || result instanceof Error) ?
//             ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
//             ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result.data));
//         res.send(response);
//     } catch (e) {
//         Logger.error("OtherBenficiary => ", e);
//         return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
//     }
// });
router.post("/fetchRcUserData", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let body = new other_benf_data(req.body);
        let result: any = await newOtherBenfServices.fetchRcUserData(body);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/updateRcAadharData", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let body = new other_benf_data(req.body);
        let result: any = await newOtherBenfServices.updateRcAadharData(body);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// router.post("/ekycCheck", requestAndResonseTime, async (req: Request, res: Response) => {
//     try {
//         let body = new other_benf_data(req.body);
//         let result: any = await newOtherBenfServices.ekycResutltCheck(body);
//         let response = (result.code || result instanceof Error) ?
//             ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
//             ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result));
//         res.send(response);
//     } catch (e) {
//         Logger.error("OtherBenficiary => ", e);
//         return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
//     }
// });

router.post("/getBenfAllStatus", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await newOtherBenfServices.getBenfAllStatus(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/eachStatusWise", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await newOtherBenfServices.eachStatusWise(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/readyToDeliverOtp", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await newOtherBenfServices.readyToDeliverOtp(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/validateReadyToDeliverOtp", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await newOtherBenfServices.validateReadyToDeliverOtp(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/delivered", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await newOtherBenfServices.delivered(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});


router.post("/otpSentToNewNumber", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await newOtherBenfServices.otpSentToNewNumber(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/validateWithNewNumber", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await newOtherBenfServices.validateWithNewNumber(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/getBenfHistory", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await newOtherBenfServices.getBenificaryHistory(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), (result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

/************************************ ********************************************/
/************************************ ********************************************/
/************************************ ********************************************/
/************************************ ********************************************/



export default router;