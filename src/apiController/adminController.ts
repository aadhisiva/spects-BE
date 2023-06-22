import Container from 'typedi';
import { EkycServices } from '../apiServices/ekycServices';
import express, { Request, Response } from 'express';
import { RESPONSEMSG, RESPONSE_EMPTY_DATA, ResponseCode, ResponseMessages } from '../utility/statusCodes';
import { AdminServices } from '../apiServices/adminServices';

const router = express.Router();

const adminServices = Container.get(AdminServices);

router.post("/all_masters", async (req: Request, res: Response) => {
    try {
        let data = req.body;
       let result = await adminServices.getAllMasters(data);
       let response = (result?.code || result instanceof Error) ?
       ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
       ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.INSERT_SUCCESS, result);
       res.send(response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});