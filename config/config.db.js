import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully to MongoDB (^_^) ');
    } catch (error) {
        throw new Error(`Internal server Error, please try again::: ${error.message}`);
    }
};

export default connectDB;