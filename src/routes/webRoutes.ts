import express from 'express';
import multer from "multer";

const router = express.Router()

import { authenticateToken, authenticateTokenWeb, authVersion } from '../utils/middlewares';
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

router.post('/getMasterDropDown', authenticateTokenWeb, webController.getMasterDropDown);
router.post('/getMasterDropDownForReports', authenticateTokenWeb, webController.getMasterDropDownForReports);
router.post('/getAssignedMasters',authenticateTokenWeb, webController.getAssignedMasters);
router.post('/getChildBasedOnParent', authenticateTokenWeb, webController.getChildBasedOnParent);
router.post('/assignChildAndGet', authenticateTokenWeb, webController.assignChildAndGet);
router.post('/addOrGetRoles', authenticateTokenWeb, webController.addOrGetRoles);
router.post('/addOrGetRoleAccess', authenticateTokenWeb, webController.addOrGetRoleAccess);
router.post('/assignmentProcess', authenticateTokenWeb, webController.assignmentProcess);

router.post('/fetchSearchReports', authenticateTokenWeb, webController.fetchSearchReports);
router.post('/searchAndDownloadReports', authenticateTokenWeb, webController.searchAndDownloadReports);

router.post('/fetchStateOrDistrictReports', authenticateTokenWeb, webController.fetchStateOrDistrictReports);
router.post('/downloadStateOrDistrictReports', authenticateTokenWeb, webController.downloadStateOrDistrictReports);

router.post('/fetchRefraLoginReports', authenticateTokenWeb, webController.fetchRefraLoginReports);
router.post('/fetchDetailedReportsOfId', authenticateTokenWeb, webController.fetchDetailedReportsOfId);
router.post('/fetchImagesOfId', authenticateTokenWeb, webController.fetchImagesOfId);
router.post('/downloadStateOrDistrictReports', authenticateTokenWeb, webController.downloadRefraLoginReports);
router.post('/fetchCountsByLogin', authenticateTokenWeb, webController.fetchCountsByLogin);
router.post('/fetchPrimaryScreeningReports', authenticateTokenWeb, webController.fetchPrimaryScreeningReports);

export default router;