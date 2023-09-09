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
import { OtherBenfServices } from '../apiServices/otherBenServices';
import { other_benf_data } from '../entity/other_benf_data';
import { encryptData } from '../utility/resusableFun';
import { rc_data } from '../entity/rc_data';
import { requestAndResonseTime } from '../utility/middlewares';

const router = express.Router();

const otherBenfServices = Container.get(OtherBenfServices);
/* new version apis for other beneficiary */

router.post("/addAadharData", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let body = req.body;
        let result: any = await otherBenfServices.directEkycForAadhar(body);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/addDataAfterEkyc", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let body = req.body;
        let result: any = await otherBenfServices.addDataAfterEkyc(body);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/updateAadharData", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let body = req.body;
        let result: any = await otherBenfServices.updateAadharData(body);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/addRcData", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let body = new rc_data(req.body);
        let result: any = await otherBenfServices.addRcDataAndGet(body);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/rcBasedOnNumberWise", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let body = new other_benf_data(req.body);
        let result: any = await otherBenfServices.rcBasedOnNumberWise(body);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/fetchRcUserData", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let body = new other_benf_data(req.body);
        let result: any = await otherBenfServices.fetchRcUserData(body);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/updateRcAadharData", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let body = new other_benf_data(req.body);
        let result: any = await otherBenfServices.updateRcAadharData(body);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

/************************************ ********************************************/
router.post("/add_datails_adr", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.addKutumbaAaadharDetails(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/get_aadhar_data", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.getDataByAadharHash(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/get_rc_data", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new rc_data(req.body);
        let result = await otherBenfServices.getDataByRcNo(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/add_details_rc", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.addKutumbaRcDetails(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/update_benf_byaadhar", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.updateBefDataByAadhar(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/send_otp_by_aadhar", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.sendOtpByAadharAndHash(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/validate_otp_by_aadhar", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.checkOtpByAadharAndHash(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.VALIDATE), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/update_by_aadhar_rc", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.updateBefDataByRcAndAadharHash(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.UPDATE_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/get_bef_status", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.getBenificaryStatus(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/statusWise", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.statusWiseData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/get_status_data_byId", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.statusDataByIdWith(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/get_bef_status", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.getBenificaryStatus(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/rc_aadhar_data", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.getRcBasedOnAadharData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/sent_otp_ready_to_deliver", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.readyTODeliver(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.OTP), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/pending_to_ready", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.pendingToReady(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.OTP), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/deliver_otp_check", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.deliverOtpCheck(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.VALIDATE), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/read_to_delivered", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.updateBenificaryEachID(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.UPDATE_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/ekyc_text", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.getEkycDataFromEkyc(data);
        let response = (result?.code || result instanceof Error) ?
            result :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.UPDATE_SUCCESS), result?.data);
        return res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    };
});

async function checkData(data, res) {
    let resultData = await otherBenfServices.getEkycDataFromEkyc(data);
    if (!res.headersSent) {
        if (resultData?.code != 500) {
            return res.send({ code: resultData.code, status: resultData.status, data: encryptData(resultData.message) });
        }
    }
};

router.post("/ekyc_response", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        setTimeout( async () => {
                let result  = await otherBenfServices.getEkycDataFromEkyc(data);
            res.send(result)
        }, 10000)
    } catch (e) {
        Logger.error("error", e);
        return res.send({ code: 500, status: "Failed", message: "something went wrong." })
    }
});

router.post("/get_bef_history", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.getBenificaryHistory(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/otp-sent", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.otpSentToENteredNumber(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/otp-validate", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new other_benf_data(req.body);
        let result = await otherBenfServices.otpValidateToENteredNumber(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("OtherBenficiary => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});


export default router;