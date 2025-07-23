import dotenv from 'dotenv';
dotenv.config();

import userModel from '../models/user.model.js';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
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
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        return res.redirect('/');

    } catch (error) {
        return res.status(500).json({ message: 'Error logging in', error: error.message });
    }
}

const getUsers = async (req, res) => {
    try {
        const users = await userModel.find();
        return res.status(200).json({ message: 'Users retrieved successfully', users });
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving user', error: error.message });
    }
}

const logoutUser = (req, res) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    
    return res.redirect('/auth/login');
};
export { createUser, getUsers, loginUser, logoutUser }