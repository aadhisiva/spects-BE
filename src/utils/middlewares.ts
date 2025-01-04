import { NextFunction } from "express";
import { repository } from "../db/repos";
import { API_VERSION_ISSUE } from "./constants";
import { response401, response403 } from "./resBack";
import jwt, { Algorithm } from "jsonwebtoken";

export async function authVersion(req: Request | any, res: Response | any, next: NextFunction) {
    // Read the version from the request header
    const authVersion = req.headers["version"];
    if (!authVersion) return res.status(403).send({ code: 403, status: "Failed", message: "Provided version in header." })
    let getVersion = await repository.versionRepo.find();
    let checkVersion = (authVersion == getVersion[0].Version || authVersion == getVersion[1].Version);
    if (!checkVersion) return res.status(403).send({ code: 403, status: "Failed", message: API_VERSION_ISSUE });
    next();
};

export const authenticateToken = async (req: Request | any, res: Response | any, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ code: 401, message: 'Access denied. No token provided.' });
    }
    const options: any = { algorithms: 'HS256' as Algorithm }
    jwt.verify(token, process.env.SECRET_KEY!, options, async (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ code: 403, message: 'Failed to authenticate.' });
        }
        req.user = { ...req.user, ...user };
        next();
    });
};

export const authenticateTokenWeb = async (req: Request | any, res: Response | any, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ code: 401, message: 'Access denied. No token provided.' });
    }
    const options: any = { algorithms: 'HS256' as Algorithm }
    jwt.verify(token, process.env.SECRET_KEY!, options, async (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ code: 403, message: 'Failed to authenticate.' });
        }
        req.user = { ...req.user, ...user };
        next();
    });
};