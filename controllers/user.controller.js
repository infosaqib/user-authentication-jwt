import dotenv from 'dotenv';
dotenv.config();

import userModel from '../models/user.model.js';
import validator from 'validator';
// import { v4 } from 'uuid';
import { setUser } from '../services/auth.js';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createUser = async (req, res) => {
    const { fullname, email, password } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!fullname || !email || !password) {
        return res.status(400).json({ error: 'Please fill all the fields' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (!validator.isStrongPassword(password, { minLength: 6 })) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        const user = new userModel({ fullname, email, password: hashedPassword });
        await user.save();

        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(201).json({ message: 'User created successfully', user });
        } else {
            return res.redirect('/auth/login');
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error creating user', error: error.message });
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide both email and password' });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }


        const user = await userModel.findOne({ email });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.redirect('/auth/login');
        }


        const sessionId = uuid();
        setUser(sessionId, user);

        res.cookie('userId', sessionId)
        return res.redirect('/')

    } catch (error) {
        return res.status(500).json({ message: 'Error logging in', error: error.message });
    }
}

const getUsers = async (req, res) => {
    try {
        const user = userModel.find();
        return res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        return res.status(500).json({ message: 'Error creating user', error: error.message });
    }
}

const googleLogin = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: 'Please provide a token' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub } = payload;

        let user = await userModel.findOne({ email });
        if (!user) {
            user = new userModel({ email, fullname: name, picture, googleId: sub });
            await user.save();
        }

        const jwtToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // ✅ Set JWT as HTTP-only cookie
        res.cookie('jwt', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });

        return res.status(200).json({ message: 'Login successful' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to authenticate user with Google.' });
    }
};




export { createUser, getUsers, loginUser, googleLogin }