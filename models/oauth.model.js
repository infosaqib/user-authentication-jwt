import mongoose from 'mongoose';

const authSchema = new mongoose.Schema({
    
    googleId: {
      type: String,
      sparse: true,
      unique: true
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    avatar: {
      type: String,
      default: null
    },
    
  });
  
  userSchema.index({ googleId: 1 });

const Auth = mongoose.model('Auth', authSchema);
export default Auth;