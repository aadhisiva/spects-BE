import express from 'express';
import multer from "multer";

const router = express.Router()

import { authenticateToken, authVersion } from '../utils/middlewares';
import Container from 'typedi';
import { WebController } from '../controller/webController';

const webController = Container.get(WebController);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload = multer({storage});

const memoryStorage = multer.memoryStorage();
const uploadImage = multer({ storage: memoryStorage });

router.post('/checkMobileLogin', webController.checkMobileLogin);
router.post('/getDataAccess', webController.getDataAccess);
router.post('/verifyOtp', webController.verifyOtp);

router.post('/getMasterDropDown', webController.getMasterDropDown);
router.post('/getAssignedMasters', webController.getAssignedMasters);
router.post('/getChildBasedOnParent', webController.getChildBasedOnParent);
router.post('/assignChildAndGet', webController.assignChildAndGet);
router.post('/addOrGetRoles', webController.addOrGetRoles);
router.post('/addOrGetRoleAccess', webController.addOrGetRoleAccess);
router.post('/assignmentProcess', webController.assignmentProcess);

export default router;