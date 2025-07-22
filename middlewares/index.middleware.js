import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

function setupMiddlewares(app) {

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://accounts.google.com",
          "https://apis.google.com",
          "https://www.gstatic.com",
          "https://ajax.googleapis.com"
        ],
        connectSrc: [
          "'self'",
          "https://accounts.google.com",
          "https://oauth2.googleapis.com"
        ],
        frameSrc: ["'self'", "https://accounts.google.com"],
        imgSrc: ["'self'", "data:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'"]
      },
    },
  }));
  app.use(cors());
  // CSP middleware - add this BEFORE your routes
// Temporarily disable CSP for testing

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());


}

export { setupMiddlewares };