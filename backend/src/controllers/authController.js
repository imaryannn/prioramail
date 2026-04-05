import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { googleAuthService } from '../services/googleAuth.js';
import { User } from '../models/User.js';

export const authController = {
  googleLogin: (req, res) => {
    const authUrl = googleAuthService.getAuthUrl();
    res.json({ authUrl });
  },

  googleCallback: async (req, res) => {
    try {
      const { code } = req.query;
      const frontendUrl = config.frontend.url;

      if (!code) {
        return res.redirect(`${frontendUrl}?error=no_code`);
      }

      const tokens = await googleAuthService.getTokens(code);
      const userInfo = await googleAuthService.getUserInfo(tokens.access_token);

      let user = await User.findOne({ googleId: userInfo.id });

      if (user) {
        user.accessToken = tokens.access_token;
        user.refreshToken = tokens.refresh_token || user.refreshToken;
        user.tokenExpiry = new Date(Date.now() + tokens.expiry_date);
        user.lastLogin = new Date();
        user.name = userInfo.name;
        user.picture = userInfo.picture;
        await user.save();
      } else {
        user = await User.create({
          googleId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(Date.now() + tokens.expiry_date),
        });
      }

      const jwtToken = jwt.sign(
        { userId: user._id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.redirect(`${frontendUrl}?token=${jwtToken}`);
    } catch (error) {
      console.error('Google callback error:', error);
      const frontendUrl = config.frontend.url;
      res.redirect(`${frontendUrl}?error=auth_failed`);
    }
  },

  getProfile: async (req, res) => {
    try {
      const user = req.user;
      res.json({
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get profile' });
    }
  },

  logout: async (req, res) => {
    try {
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  },
};
