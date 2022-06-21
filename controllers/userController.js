const User = require("../models/User");
const bcrypt = require("bcryptjs");
const send_mail = require("../utils/nodeMailer");
const dotenv = require("dotenv");
const otpGenerator = require("../utils/otpGenerator");
const path = require("path");
const formValidation = require("../utils/validation");
// Render singup page
const renderSignUpPage = (req, res, next) => {
  if (!req.user) {
    res.render("user_signup", {
      error: req.flash("error"),
    });
  }
};

// Signup request
const signUpRequest = async (req, res, next) => {
  const { firstname, lastname, email, passwd, repeatPasswd } = req.body;
  const path = req.file ? req.file.originalname : "user.png";
  if (!firstname || !lastname || !email || !passwd || !repeatPasswd) {
    req.flash("error", "Enter every fields");
    return res.redirect("/users/signup");
  }
  let error = formValidation(firstname, lastname, email, passwd, repeatPasswd);
  if (error) {
    req.flash("error", error);
    return res.redirect("/users/signup");
  }
  try {
    let user = await User.findOne({ email });
    if (user && !user.active) {
      req.body.passwd = await bcrypt.hash(req.body.passwd, 10);
      req.body.otp = otpGenerator();
      req.body.image = path;
      user = await User.findByIdAndUpdate(user.id, req.body, { new: true });
      send_mail(user.firstname, user.email, user.otp, 0, null);
      return res.redirect("/users/signup/emailverification/" + user.id);
    }

    if (user && user.active) {
      req.flash("emailError", "Email is already registered");
      return res.redirect("/users/signup");
    }
    req.body.image = path;
    req.body.passwd = await bcrypt.hash(req.body.passwd, 10);
    req.body.otp = otpGenerator();
    user = await User.create(req.body);
    send_mail(user.firstname, user.email, user.otp, 0, null);
    res.redirect("/users/signup/emailverification/" + user.id);
  } catch (err) {
    next(err);
  }
};

// Render email verification page
const renderEmailVerification = async (req, res, next) => {
  if (!req.user) {
    const { id } = req.params;
    try {
      const user = await User.findById(id);
      console.log(user, "user");
      res.render("email_verification", {
        id: user.id,
        email: user.email,
        error: req.flash("error"),
      });
    } catch (err) {
      next(err);
    }
  }
};

// process email verification
const processEmailVerification = async (req, res, next) => {
  let { id } = req.params;
  const { one, two, three, four, five, six } = req.body;
  const newOtp = one + two + three + four + five + six;
  if (!one || !two || !three || !four || !five || !six) {
    req.flash("error", "Enter all the fields");
    return res.redirect("/users/signup/emailverification/" + id);
  }
  try {
    let user = await User.findById(id);
    console.log(user.otp, newOtp);
    if (user.otp === newOtp) {
      user = await User.findByIdAndUpdate(id, { active: true });
      res.redirect("/");
    } else {
      req.flash("error", "OTP is wrong");
      return res.redirect("/users/signup/emailverification/" + id);
    }
  } catch (err) {
    next(err);
  }
};

// Render login page
const renderLoginPage = (req, res) => {
  if (!req.user) {
    res.render("user_signin", {
      error: req.flash("error"),
      emailError: req.flash("emailError"),
      passwdError: req.flash("passwdError"),
    });
  }
};

// Process login request
const processLoginRequest = async (req, res, next) => {
  const { email, passwd } = req.body;
  console.log(email);
  if (!email || !passwd) {
    req.flash("error", "Enter both fields");
    return res.redirect("/users/login");
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash("emailError", "Email is not registered");
      return res.redirect("/users/login");
    }
    if (user.isBlocked) {
      req.flash("error", "Your account is blocked please contact Admin");
      return res.redirect("/users/login");
    }
    const result = await bcrypt.compare(passwd, user.passwd);
    if (!result) {
      req.flash("passwdError", "Password is wrong");
      return res.redirect("/users/login");
    }
    const token = await user.signToken();
    res.cookie("user_token", token);
    res.redirect("/");
  } catch (err) {
    next(err);
  }
};

// Redirect to email verification page to change the password
const passwordChangeEmailVerify = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    req.flash("error", "Enter your email");
    return res.redirect("/users/confirmEmail");
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error", "This email is not registered");
      return res.redirect("/users/confirmEmail");
    }
    const link = `https://zapatos-stores.xyz/users/passwordChange/${user.id}`;
    console.log(email);
    send_mail(user.firstname, email, null, 1, link);
    req.flash("msg", "Password reset link has send to your mail");
    res.redirect("/users/confirmEmail");
  } catch (err) {
    next(err);
  }
};

// Process password change request
const processPasswordChange = async (req, res, next) => {
  let { passwd, cpasswd } = req.body;
  const { id } = req.params;
  if (!passwd || !cpasswd) {
    req.flash("error", "Enter both fields");
    return res.redirect("/users/passwordChange/" + id);
  }
  if (passwd.length < 6) {
    req.flash("error", "Password should be atleat 6 characeters");
    return res.redirect("/users/passwordChange/" + id);
  }
  if (passwd !== cpasswd) {
    req.flash("error", "Enter the correct password");
    return res.redirect("/users/passwordChange/" + id);
  }
  try {
    passwd = await bcrypt.hash(passwd, 10);
    user = await User.findByIdAndUpdate(id, { passwd }, { new: true });
    req.flash("msg", "Your password is successfully updated");
    res.redirect("/users/passwordChange/" + user.id);
  } catch (error) {
    next(error);
  }
};
module.exports = {
  renderSignUpPage,
  signUpRequest,
  renderEmailVerification,
  processEmailVerification,
  renderLoginPage,
  processLoginRequest,
  passwordChangeEmailVerify,
  processPasswordChange,
};
