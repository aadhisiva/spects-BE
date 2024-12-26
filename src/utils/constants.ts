import dotenv from "dotenv";
dotenv.config();

export const YES = 'Yes';
export const SUPER_ADMIN = 'Super Admin';

export const API_VERSION_ISSUE = 'New Version Available. Please Contact To Technical Team';


export enum WEBPAGES {
    LOGIN_PAGE='Login Page',
    USER_MANAGEMENT='User Management',
    SCEHEMS='Schemes',
    SECTORS='Sectors',
    DEPARTMENT='Department',
    ROLES='Roles',
    ACTIVITY='Activity',
}


export enum RESPONSETYPE {
    SUCCESS='SUCCESS',
    FAILED='FAILED'
}
export enum WEBMESSAGES {
    SEND_OTP='Send Otp',
    VERIFY_OTP='Send Otp',
    GET_ALLDATA='Get All Data',
    ADDED='New Data Added',
    UPDATE='Update Exist Data', 
}
export enum MOBILE_MESSAGES {
    SEND_OTP='Send Otp',
    VERIFY_OTP='Verify Otp',
    GET_ALLDATA='Get All Data',
    ADDED='New Data Added',
    UPDATE='Update Exist Data',
    GET_SCHEMES="Get Schemes",
    GET_QUESTIONS="Get Questions",
    SAVE_QUESTION="Save Question",
    SAVE_SECTOR="Save Sector",
    SAVE_SCHEME="Save Scheme",
    SAVE_ACTIVITY="Save Activity",
    SAVE_SUBACTIVITY="Save SubActivity"
}

export enum RESPONSEAPI_MESSAGE {
    FETCHED = "Fetched Successfully",
    UPDATED = "Updated Successfully",
    INSERTED = "Inserted Successfully",
    DATA_UPDATED = "Data Updated",
    DATA_SAVED = "Data Saved",
    CORRECT = "Send correct info to server",
    OTP_VERFIY = "Otp verification successfully",
    OTP_VERFIY_FAILED = "Otp verification failed",
};


export const EKYC_ACCESS_DENIED = "Access Denied From EKYC."
export const KUTUMBA_ACCESS_DENIED = "Access Denied From Kutumba."
export const EKYC_SUCCESS = "You Are Completed Ekyc SuccessFully."
export const ACCESS_DENIED = "Access Denied." 
export const DATA_SAVED = "Data Saved." 
export const COMPLETED = "Completed" 
export const PHONE_REGESTERED = "Phone Number Already Registered With Four Members." ;



export const DISTRICT_OFFICER_LOGIN = 'district_officer';
export const TALUKA_OFFICER_LOGIN = 'taluka';
export const PHCO_OFFICER_LOGIN = 'phco';
export const REFRACTIONIST_LOGIN = 'refractionist';

export const DELIVERED = 'delivered';
export const READY_TO_DELIVER = 'ready_to_deliver';
export const ORDER_PENDING = 'order_pending';

export const OTHER_BENEFICIARY = 'otherBenificiary';
export const AADHAR_PROCESS = 'aadhar';

export const NO = 'No';


export const API_SESSION_EXPIRED = 'Your Session Has Expired. Please Try To Login Again.';
export const HEADERS_ISSUE = 'Please Check Headers(version, userid, token).';


// export const allowedHosts:Array<String> = ['https://mis.watershed.karnataka.gov.in', 'http://localhost:8082', 'http://localhost:8881'];  // Add valid hosts here
export const allowedHosts:Array<String | any> = [process.env.ALLOWD_HOST, process.env.ALLOWD_HOST1, process.env.ALLOWD_HOST2, "192.168.183.170:8881"];  // Add valid hosts here