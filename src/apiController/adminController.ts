import Container from 'typedi';
import express, { Request, Response, response } from 'express';
import { RESPONSEMSG, RESPONSE_EMPTY_DATA, ResponseCode, ResponseMessages } from '../utility/statusCodes';
import { AdminServices } from '../apiServices/adminServices';
import { district_data, master_data } from '../entity';
import { reUsableResSendFunction } from '../utility/resusableFun';
import { authenticateToken, validateFeilds } from '../utility/middlewares';
import { login_validation, otp_validation, update_district, update_refractionist, update_taluka } from '../utility/validations';

const router = express.Router();

const adminServices = Container.get(AdminServices);

router.post("/login", validateFeilds(login_validation), async (req: Request, res: Response) => {
    try {
        let data = req.body
        let result = await adminServices.login(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), result.data);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/otp_check", validateFeilds(otp_validation), async (req: Request, res: Response) => {
    try {
        var session;
        let data = req.body;
        console.log(req.session)
        let result = await adminServices.validationOtp(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), result.data);
        session = req.session;
        session.userid = result?.data;
        console.log(req.session)
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/resend_otp", validateFeilds(login_validation), async (req: Request, res: Response) => {
    try {
        let data = req.body
        let result = await adminServices.resendOtp(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), result.data);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/all_masters", authenticateToken, async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.getAllMasters(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/get_orders_count", authenticateToken, async (req: Request, res: Response) => {
    try {
        let result = await adminServices.getAllOrders();
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/delivered", authenticateToken, async (req: Request, res: Response) => {
    try {
        let result = await adminServices.getAllDelivered();
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/pending", authenticateToken, async (req: Request, res: Response) => {
    try {
        let result = await adminServices.getAllPending();
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/update_data", authenticateToken, validateFeilds(update_refractionist), async (req: Request, res: Response) => {
    try {
        let data = new master_data(req.body);
        let result = await adminServices.getUpdatedData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.UPDATE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/talukas_data", authenticateToken, async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.getTalukasData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/districts_data",authenticateToken, async (req: Request, res: Response) => {
    try {
       let result = await adminServices.getDistrictsData();
       let response = (result?.code || result instanceof Error) ?
       ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
       ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.INSERT_SUCCESS, result);
       res.send(response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/update_districts_Data", authenticateToken, validateFeilds(update_district), async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.updateDistrictsData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.UPDATE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/update_taluka_data", authenticateToken, validateFeilds(update_taluka), async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.updateTalukaData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.UPDATE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/reports_data", authenticateToken, async (req: Request, res: Response) => {
    try {
        let result = await adminServices.getReportsData();
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/getUser_data", authenticateToken, async (req: Request, res: Response) => {
    try {
        let data = new district_data(req.body);
        let result = await adminServices.getLoginUserData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});




export default router;