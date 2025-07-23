import express from 'express';
const router = express.Router();
import { getUsers, createUser, loginUser, logoutUser } from '../controllers/user.controller.js';

/* GET users listing. */
router.get('/', getUsers);

router.post('/signup', createUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser);

export default router;
