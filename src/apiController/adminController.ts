import Container from 'typedi';
import express, { Request, Response, response } from 'express';
import { RESPONSEMSG, RESPONSE_EMPTY_DATA, ResponseCode, ResponseMessages } from '../utility/statusCodes';
import { AdminServices } from '../apiServices/adminServices';
import { district_data, master_data } from '../entity';
import { reUsableResSendFunction } from '../utility/resusableFun';
import { authenticateToken, validateFeilds, verifyUser } from '../utility/middlewares';
import { login_validation, otp_validation, update_district, update_refractionist, update_taluka } from '../utility/validations';
import axios from 'axios';

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

router.post("/verify-token", async (req,res) => {
    try{
        let token = req.body.token;
        // replace APP_SECRET_KEY with your reCAPTCHA secret key
        let APP_SECRET_KEY = process.env.APP_SECRET_KEY;
        let response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${APP_SECRET_KEY}&response=${token}`);
        return res.status(200).json({
            success:true,
            message: "Token successfully verified",
            data: response.data
        });
    }catch(error){
        return res.status(500).json({
            success:false,
            message: "Error verifying token"
        })
    }
});


router.get('/getMe', (req, res) => {
    if (req?.session?.user) {
        res.status(200).send({ success: true, userData: req.session?.user });
    } else {
        res.status(404).send({ success: false });
    };
});

router.post("/logout", async (req: Request, res: Response) => {
    try {
        req?.session?.destroy((err) => {
            if (err) return res.status(400).json({ code: 400, msg: "please try again" });
            res.status(200).json({ code: 200, msg: "logout" });
        });
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    };
});

router.post("/otp_check", validateFeilds(otp_validation), async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.validationOtp(data, req);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), result.data);
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

router.post("/all_masters", authenticateToken, verifyUser, async (req: Request, res: Response) => {
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

router.post("/get_orders_count", authenticateToken, verifyUser, async (req: Request, res: Response) => {
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

router.post("/delivered", authenticateToken, verifyUser, async (req: Request, res: Response) => {
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

router.post("/pending", authenticateToken, verifyUser, async (req: Request, res: Response) => {
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

router.post("/update_data", authenticateToken, verifyUser, validateFeilds(update_refractionist), async (req: Request, res: Response) => {
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

router.post("/talukas_data", authenticateToken, verifyUser, async (req: Request, res: Response) => {
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

router.post("/districts_data", authenticateToken, verifyUser, async (req: Request, res: Response) => {
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

router.post("/update_districts_Data", authenticateToken, verifyUser, validateFeilds(update_district), async (req: Request, res: Response) => {
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

router.post("/update_taluka_data", authenticateToken, verifyUser, validateFeilds(update_taluka), async (req: Request, res: Response) => {
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

router.post("/reports_data", authenticateToken, verifyUser, async (req: Request, res: Response) => {
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

router.post("/getUser_data", authenticateToken, verifyUser, async (req: Request, res: Response) => {
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