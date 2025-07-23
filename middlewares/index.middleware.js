import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

function setupMiddlewares(app) {

  app.use(helmet());
  app.use(cors());

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
}

export { setupMiddlewares };