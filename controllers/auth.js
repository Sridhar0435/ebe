const User = require("../models/User");
const jwt = require("jsonwebtoken"); // to generate signed token
const expressJwt = require("express-jwt"); //  for authorization
const { errorHandler } = require("../helpers/dbErrorHandler");
const { validationResult } = require("express-validator");
require("dotenv").config();
exports.signup = (req, res) => {
  const errors = validationResult(req);
  // console.log(errors.isEmpty());
  console.log(req.body);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors });
  }
  const user = new User(req.body);
  user.save((err, user) => {
    if (err) {
      return res.status(400).json({
        err: errorHandler(err),
      });
    }
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({
      user,
    });
  });
};

exports.signin = (req, res) => {
  // find the user based on email

  const { email, password } = req.body;
  User.findOne({ email }, (err, user) => {
    console.log("User found ", user);
    if (err || !user) {
      return res
        .status(400)
        .json({ err: "User with this email doesnt exist. please signup" });
    }

    // if user is found make sure the email and password match
    // Create authenticate method in user model
    if (!user.authenticate(password)) {
      return res.status(401).json({ err: "Email and password dont match" });
    }
    // generate a signed token with user id and secret
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    // persist the token as 't' in cookie with expiry date
    res.cookie("t", token, { expire: new Date() + 9999 });
    // return respose with user and token to front end client

    const { _id, name, email, role } = user;
    return res.json({ token, user: { _id, email, name, role } });
  });
};

exports.signout = (req, res) => {
  res.clearCookie("t");
  res.json({ Message: "SignedOut successfully" });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"], // added later
  userProperty: "auth",
});

exports.isAuth = (req, res, next) => {
  let user = req.profile && req.auth && req.profile._id == req.auth._id;
  if (!user) {
    return res.status(403).json({
      err: "Access denied",
    });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    //0 = user- //1 - admin
    return res.status(403).json({
      err: "Admin resource! Access denied",
    });
  }
  next();
};
