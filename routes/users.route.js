import express from 'express';
const router = express.Router();
import { getUsers, createUser, loginUser, googleLogin } from '../controllers/user.controller.js';

/* GET users listing. */
router.get('/', getUsers);

router.post('/signup', createUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);

export default router;
