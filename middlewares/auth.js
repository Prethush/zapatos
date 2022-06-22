const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config({ path: "../config/config.env" });

module.exports = {
  verifyToken: async (req, res, next) => {
    const { user_token, admin_token } = req.cookies;
    try {
      if (user_token) {
        let payload = await jwt.verify(user_token, process.env.TOKEN_SECRET);
        req.user = payload;
        return next();
      } else {
        if (!admin_token) {
          next();
        }
      }
    } catch (err) {
      next(err);
    }
  },

  authOptional: async (req, res, next) => {
    const { user_token, admin_token } = req.cookies;
    try {
      if (user_token) {
        let payload = await jwt.verify(user_token, process.env.TOKEN_SECRET);
        req.user = payload;
        return next();
      } else {
        if (!admin_token) {
          next();
        }
      }
    } catch (err) {
      next(err);
    }
  },

  adminAuth: async (req, res, next) => {
    const { admin_token, user_token } = req.cookies;
    try {
      if (admin_token) {
        const payload = await jwt.verify(admin_token, process.env.TOKEN_SECRET);
        req.admin = payload;
        return next();
      } else {
        if (!user_token) {
          next();
        }
      }
    } catch (err) {
      next(err);
    }
  },

  adminIsLoggedIn: (req, res, next) => {
    const { admin_token } = req.cookies;
    if (!admin_token) {
      next();
    }
  },
};
