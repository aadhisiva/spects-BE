import { Response } from "express";

export const response400 = (res: Response, msg: string) => {
  return res.status(400).send({
    code: 400,
    status: "Bad Request",
    message: msg,
  });
};


export const response404 = (res: Response, msg: string) => {
  return res.status(404).send({
    code: 404,
    status: "Not Found",
    message: msg,
  });
};


export const response200 = (res: Response, data?: any, message?: string) => {
  return res.status(200).send({
    code: 200,
    status: "Success",
    message: message || "Success",
    data: data || {}
  });
};

export const responseForSpec200 = (res: Response, data?: any, message?: string, ekycRequired?: string, check?: string) => {
  return res.status(200).send({
    code: 200,
    status: "Success",
    message: message || "Success",
    ekycRequired: ekycRequired,
    errorInfo: check,
    data: data || {}
  });
};


export const response401 = (res: Response, msg?: any) => {
  return res.status(401).send({
    code: 401,
    status: "Unauthorized",
    message: msg
  });
};

export const response403 = (res: Response, msg?: any) => {
  return res.status(403).send({
    code: 403,
    status: "Forbidden",
    message: msg
  });
};
