# Google OAuth Integration Guide
## Adding Google Authentication to Existing Node.js + Express + EJS + MongoDB + JWT Project

This guide shows exactly what to add/modify in your existing project to integrate Google OAuth authentication.

## Step 1: Google Cloud Console Setup

### 1.1 Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create new one
3. Navigate to **APIs & Services** → **Library**
4. Enable **Google+ API** and **People API**
5. Go to **APIs & Services** → **Credentials**
6. Click **Create Credentials** → **OAuth 2.0 Client ID**
7. Configure consent screen if prompted
8. Select **Web application**
9. Add authorized redirect URIs:
   ```
   http://localhost:3000/auth/google/callback
   https://yourdomain.com/auth/google/callback (for production)
   ```
10. Save and copy **Client ID** and **Client Secret**

## Step 2: Install Required Dependencies

Add these packages to your existing project:

```bash
npm install passport passport-google-oauth20
```

## Step 3: Environment Variables

Add to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Step 4: Modify User Model

Update your existing User model to support Google OAuth:

```javascript
// models/User.js - ADD these fields to your existing schema

const userSchema = new mongoose.Schema({
  // ... your existing fields ...
  
  // ADD these Google OAuth fields:
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
  
  // ... rest of your existing fields ...
});

// ADD this index for better performance
userSchema.index({ googleId: 1 });
```

## Step 5: Create Passport Google Strategy

Create `config/passport.js` (or add to existing passport config):

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // adjust path as needed

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let existingUser = await User.findOne({ googleId: profile.id });
    
    if (existingUser) {
      return done(null, existingUser);
    }

    // Check if user exists with same email (link accounts)
    const existingEmailUser = await User.findOne({ 
      email: profile.emails[0].value 
    });

    if (existingEmailUser) {
      // Link Google account to existing user
      existingEmailUser.googleId = profile.id;
      existingEmailUser.provider = 'google';
      existingEmailUser.avatar = profile.photos[0]?.value;
      await existingEmailUser.save();
      return done(null, existingEmailUser);
    }

    // Create new user
    const newUser = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      displayName: profile.displayName,
      avatar: profile.photos[0]?.value,
      provider: 'google'
      // Don't set password for Google users
    });

    await newUser.save();
    return done(null, newUser);

  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
```

## Step 6: Add Google OAuth Routes

Add these routes to your existing auth routes file:

```javascript
// routes/auth.js - ADD these routes to your existing auth routes

const passport = require('passport');

// Initiate Google OAuth
router.get('/google', 
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/auth/login',
    session: false // We're using JWT, not sessions
  }),
  async (req, res) => {
    try {
      // Generate JWT token for the user
      const token = jwt.sign(
        { 
          userId: req.user._id,
          email: req.user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Set JWT cookie
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Redirect to dashboard/profile
      res.redirect('/dashboard'); // or wherever you redirect after login
      
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect('/auth/login?error=oauth_failed');
    }
  }
);
```

## Step 7: Initialize Passport in Main App

In your main `app.js` file, ADD these lines:

```javascript
// app.js - ADD these lines

const passport = require('./config/passport'); // adjust path

// ADD these middleware BEFORE your routes
app.use(passport.initialize());
// Note: We don't use passport.session() since we're using JWT

// ... your existing middleware and routes ...
```

## Step 8: Update Your Login Template

Add Google login button to your existing login form:

```html
<!-- views/login.ejs - ADD this button to your existing login form -->

<div class="login-form">
  <!-- Your existing login form -->
  
  <!-- ADD this Google login section -->
  <div class="text-center my-3">
    <hr>
    <p class="text-muted">Or sign in with</p>
  </div>
  
  <div class="d-grid">
    <a href="/auth/google" class="btn btn-danger btn-lg">
      <i class="fab fa-google me-2"></i>
      Continue with Google
    </a>
  </div>
</div>

<style>
/* ADD this CSS for Google button styling */
.btn-danger {
  background-color: #db4437;
  border-color: #db4437;
}
.btn-danger:hover {
  background-color: #c23321;
  border-color: #c23321;
}
</style>
```

## Step 9: Handle Google Users in Existing Middleware

Update your JWT authentication middleware to handle Google users:

```javascript
// middleware/auth.js - MODIFY your existing JWT middleware

const authenticateJWT = async (req, res, next) => {
  try {
    const token = req.cookies.jwt || 
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      res.clearCookie('jwt');
      req.user = null;
      return next();
    }

    req.user = user;
    res.locals.user = user; // Make available in templates
    next();

  } catch (error) {
    console.error('JWT Authentication error:', error);
    res.clearCookie('jwt');
    req.user = null;
    next();
  }
};
```

## Step 10: Update Profile Template

Modify your profile template to show Google avatar:

```html
<!-- views/profile.ejs - ADD/MODIFY these sections -->

<div class="profile-header">
  <div class="d-flex align-items-center">
    <!-- ADD avatar display -->
    <% if (user.avatar) { %>
      <img src="<%= user.avatar %>" alt="Profile" class="rounded-circle me-3" width="80" height="80">
    <% } else { %>
      <div class="bg-secondary rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
        <i class="fas fa-user fa-2x text-white"></i>
      </div>
    <% } %>
    
    <div>
      <h2><%= user.displayName || user.firstName + ' ' + user.lastName %></h2>
      <p class="text-muted">
        <i class="fas fa-envelope me-2"></i><%= user.email %>
        <% if (user.provider === 'google') { %>
          <span class="badge bg-danger ms-2">
            <i class="fab fa-google me-1"></i>Google Account
          </span>
        <% } %>
      </p>
    </div>
  </div>
</div>
```

## Step 11: Handle Account Linking (Optional)

Add route to link existing local account with Google:

```javascript
// routes/auth.js - ADD this route if you want account linking

router.get('/link/google', requireAuth, (req, res) => {
  if (req.user.provider === 'google') {
    return res.redirect('/profile?error=already_linked');
  }
  
  // Store user ID in session for linking after Google auth
  req.session.linkUserId = req.user._id;
  
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res);
});
```

## Step 12: Error Handling

Add error handling for OAuth failures:

```javascript
// routes/auth.js - ADD error handling

router.get('/login', (req, res) => {
  const error = req.query.error;
  let errorMessage = null;
  
  if (error === 'oauth_failed') {
    errorMessage = 'Google authentication failed. Please try again.';
  }
  
  res.render('login', {
    title: 'Login',
    error: errorMessage
  });
});
```

## Step 13: Update Logout to Handle Google Users

Modify your logout route:

```javascript
// routes/auth.js - MODIFY your existing logout route

router.post('/logout', (req, res) => {
  // Clear JWT cookie
  res.clearCookie('jwt');
  
  // If using passport sessions, logout
  if (req.logout) {
    req.logout((err) => {
      if (err) console.error('Logout error:', err);
    });
  }
  
  res.redirect('/');
});
```

## Step 14: Testing

1. Start your application
2. Go to login page
3. Click "Continue with Google"
4. Authorize your app
5. You should be redirected back and logged in
6. Check that JWT cookie is set
7. Verify user data is saved in MongoDB

## Step 15: Production Considerations

### Update redirect URIs in Google Console:
```
https://yourdomain.com/auth/google/callback
```

### Update environment variables for production:
```env
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
```

### Security considerations:
- Ensure HTTPS in production
- Set secure cookie flags
- Validate redirect URIs
- Handle CSRF tokens if needed

## Common Issues & Solutions

### Issue 1: "redirect_uri_mismatch"
**Solution:** Ensure the callback URL in Google Console exactly matches your route

### Issue 2: "invalid_client"
**Solution:** Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct

### Issue 3: User not found after Google auth
**Solution:** Check that passport.deserializeUser is working correctly

### Issue 4: JWT not set after Google login
**Solution:** Ensure you're generating and setting the JWT token in the callback route

## Summary

You've successfully added Google OAuth to your existing project by:
1. Setting up Google Cloud Console credentials
2. Installing passport and passport-google-oauth20
3. Modifying your User model to support Google users
4. Adding passport configuration
5. Creating Google OAuth routes
6. Updating templates with Google login button
7. Handling JWT tokens for Google authenticated users

Your users can now log in with either their existing local accounts or Google accounts, with automatic account linking based on email addresses.