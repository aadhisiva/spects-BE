/**
 * Name: Aadhi siva panjagala
 * Author: aadhisivapanjagala@gmail.com
 * File: main file of project
 * created: [2023-11-04]
 * Project: spectacles
 */
import "reflect-metadata";
import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import fs from "fs";
import cors from "cors";
import { AppDataSource } from './db/config';
import Logger from './loggers/winstonLogger';
import session from 'express-session';

//controllers
import mobileRoutes from "./routes/mobileRoutes";
import webRoutes from "./routes/webRoutes";
import { errorHandler, logRequestResponse } from "./utils/reqResHandler";
import { allowedHosts } from "./utils/constants";

// for accessing env variables
dotenv.config();


// express adding sever to app
const app = express();

// setting port num from env
const port: any = process.env.PORT || 3000;

// used for body parsers in apis
app.use(express.json({ limit: '100mb' }));

app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Configure session middleware
app.use(
  session({
      secret: process.env.SESSION_SECRET || 'sdfljgjgsdfkhdgu7865yf', // Use a strong secret key
      resave: false,             // Don't resave the session if unmodified
      saveUninitialized: true,   // Save session even if not initialized
      cookie: {
          httpOnly: true,          // Ensures cookies are not accessible via JavaScript
          secure: process.env.NODE_ENV == 'prodcution', // Set to true if using HTTPS
          maxAge: 3600000,         // 1 hour expiration time for the session
      },
  })
);

// CORS configuration
app.use(cors({
  origin: function (origin: string | undefined, callback: Function) {
      if (origin && allowedHosts.includes(origin)) {
          callback(null, true);
      } else if (!origin) {
          callback(null, true);
      } else {
          callback(new Error('Not allowed by CORS'));
      }
  },
  methods: ['POST', 'GET'],
  credentials: true
}));

// create for logs śad
app.use(morgan('common', {
  stream: fs.createWriteStream('./logs/application.log', { flags: 'a' })
}));

app.use(morgan('dev'));

// Disable the 'X-Powered-By' header
app.disable('x-powered-by');
app.disable('Server');

// Logging middleware
app.use(async (req: Request | any, res: any, next) => {
  const host = req.headers['host'];
  // If the Host header doesn't match the allowed domains, reject the request
  if (!allowedHosts.includes(host)) {
      return res.status(400).send('Invalid Host header');
  };
  const cspPolicy =
      "default-src 'self';" + // Allow resources only from the same origin
      "script-src 'self' 'unsafe-inline' 'unsafe-eval';" + // Allow inline scripts and eval (if necessary)
      "object-src 'none';" + // Disable plugins like Flash
      "style-src 'self' 'unsafe-inline';" + // Allow inline styles
      "img-src 'self' data:;" + // Allow images from the same origin and data URLs
      "font-src 'self';" + // Allow fonts from the same origin
      "connect-src 'self';" + // Allow connections to the same origin
      "frame-ancestors 'none';" + // Prevent embedding the site in frames
      "form-action 'self';" + // Allow forms to be submitted only to the same origin
      "upgrade-insecure-requests;" // Upgrade HTTP requests to HTTPS
      ;
  res.setHeader("Content-Security-Policy", cspPolicy); // Replace with your allowed style sources
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.removeHeader('Server');

  // Capture the original response body
  const originalSend = res.send.bind(res);
  let responseBody: any;
  res.send = async function (body: any) {
      responseBody = body;
      return originalSend(body);
  };

  next();
  res.on('finish', async () => {
      await logRequestResponse(req, res, responseBody);
  });
});

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}; // for creating uploads folder for file requests


// we are adding port connection here
app.get("/api/run", (req, res) => {
  res.send("running")
});
// controllers
// app.use('/wapi/admin', adminRouter);
app.use('/api/admin', webRoutes);
// app.use('/wapi/mobile', mobileRouter);
app.use('/api/mobile', mobileRoutes);
// 404 handler
app.all('*', (req: any, res: any) => res.status(404).send('Not Found'));
app.use(errorHandler);

// intialize the db then build a server
AppDataSource.initialize().then(async (connection) => {
  app.listen(port, () => {
    Logger.info(`⚡️[Database]: Database connected....+++++++ ${port}`);
  });
}).catch(error => {
  Logger.error("connection error :::::::", error);
  throw new Error("new Connection ERROR " + JSON.stringify(error));
})



