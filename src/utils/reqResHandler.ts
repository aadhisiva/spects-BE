import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppDataSource } from '../db/config';
import Logger from '../loggers/winstonLogger';
import { repoNames } from '../db/repos';
import { MobileLogs } from '../entities/mobileLogs';

export async function logRequestResponse(req: Request | any, res: Response, responseBody: any) {
  const logEntry = new MobileLogs();
  logEntry.Endpoint = req.originalUrl;
  logEntry.RequestBody = JSON.stringify(req.body);
  logEntry.ResponseBody = JSON.stringify(responseBody);
  logEntry.Method = req.method;
  logEntry.UserId = req['user']?.UserId;
  logEntry.Code = res.statusCode+'';
  try {
    const logRepo = await AppDataSource.getRepository(logEntry.Endpoint.includes("admin") ? repoNames.webLogsTable : repoNames.MobileLogTable);
    return await logRepo.save(logEntry);
  } catch (error) {
    Logger.error('Error logging request/response:', error);
  }
};


export const errorHandler: ErrorRequestHandler | any = async (err: Error, req: any, res: Response, next: NextFunction) => {
  Logger.error(`'${req.originalUrl}' Internal server error ` + err);
  const logEntry = new MobileLogs();
  logEntry.Endpoint = req.originalUrl;
  logEntry.RequestBody = JSON.stringify(req.body);
  logEntry.ResponseBody = JSON.stringify({});
  logEntry.Method = req.method;
  logEntry.UserId = req['user']?.UserId;
  logEntry.Code = '500';
  try {
    const logRepo = await AppDataSource.getRepository(logEntry.Endpoint.includes("admin") ? repoNames.webLogsTable : repoNames.MobileLogTable);
    await logRepo.save(logEntry);

    return res.status(500).json({
      code: 500,
      message: 'Something went wrong!',
      FMessage: err.message, // Log the error message to the console
      EName: err.name, // Log the error name to the console
      ApiPath: req.originalUrl,
      EStack: process.env.NODE_ENV === 'development' ? err.stack : {} // Provide stack trace only in development
    });
  } catch (error) {
    Logger.error('Error logging request/response:', error);
  }
};

export const apiErrorHandler = async (err: any, req: Request | any, res: Response,) => {
  Logger.error(`'${req.originalUrl}' Internal server error ` + err);
  const logEntry = new MobileLogs();
  logEntry.Endpoint = req.originalUrl;
  logEntry.RequestBody = JSON.stringify(req.body);
  logEntry.ResponseBody = JSON.stringify({});
  logEntry.Method = req.method;
  logEntry.UserId = req['user']?.UserId;
  logEntry.Code = '500';
  try {
    const logRepo = await AppDataSource.getRepository(logEntry.Endpoint.includes("admin") ? repoNames.webLogsTable : repoNames.MobileLogTable);
    await logRepo.save(logEntry);
    return res.status(500).json({
      code: 500,
      message: 'Something went wrong!',
      FMessage: err.message, // Log the error message to the console
      EName: err.name, // Log the error name to the console
      ApiPath: req.originalUrl,
      EStack: process.env.NODE_ENV === 'development' ? err.stack : {} // Provide stack trace only in development
    });
  } catch (error) {
    Logger.error('Error logging request/response:', error);
  }
};
