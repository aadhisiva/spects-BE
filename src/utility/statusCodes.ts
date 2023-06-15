export const HttpStatusCodes = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  LOOP_DETECTED: 508,
  UNPROCESSABLE_ENTITY: 422,
};

export const ResponseCode = {
  SUCCESS: "SUCCESS",
  UNPROCESS: "UNPROCESS",
  EXCEPTION: "EXCEPTION"
};

export const HttpStatusMessages = {
  OK: "OK",
  CREATED: "Created",
  ACCEPTED: "Accepted",
  BAD_REQUEST: "Bad Request",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not Found",
  SERVER_ERROR: "Internal Server Error",
  SERVICE_UNAVAILABLE: "Service Unavailable",
  UNPROCESSABLE_ENTITY: "Unprocessable Content",
  LOOP_DETECTED: "Loop Detected",
};

export const RESPONSE_EMPTY_DATA = {};
export enum RESPONSEMSG {
  INSERT_SUCCESS = "Record inserted successful.",
  UPDATE_SUCCESS = "Updated successful.",
  DELETE_SUCCESS = "Delete successful.",
  RETRIVE_SUCCESS = "Operation Successful",
  UNPROCESS= "Unprocessable Content",
  OTP= "Otp sent Successfully.",
  EXCEPTION = "Exception while processing",
}
export const ResponseMessages = (code, message = "", data = {}) => {
  const httpStatusCode = {
    SUCCESS: {
      code: HttpStatusCodes.OK,
      status: HttpStatusMessages.OK,
      message: message,
      data,
    },
    SERVER_ERROR: { code: 500, status: "INTERNEL SERVER ERROR", message, data },
    EXCEPTION: { code: HttpStatusCodes.LOOP_DETECTED, status: HttpStatusMessages.LOOP_DETECTED, message, data },
    INVALID: { status: "INVALID EMAIL ADDRESS", message, data },
    UNPROCESS: {
      code: HttpStatusCodes.UNPROCESSABLE_ENTITY,
      status: HttpStatusMessages.UNPROCESSABLE_ENTITY,
      message,
      data,
    },
    AUTHENTICATION_FAIL: {
      code: 401,
      status: "Authetication Error",
      message,
      data,
    },
  };
  return httpStatusCode[code];
};
