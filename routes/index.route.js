import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
const router = express.Router();
import { jwtAuth } from '../middlewares/jwtAuth.middleware.js';


/* GET home page. */
router.get('/', jwtAuth, function (req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/auth/signup', function (req, res, next) {
  res.render('signup');
});
router.get('/auth/login', function (req, res, next) {
  res.render('login');
});

export default router;
