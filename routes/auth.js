const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const {
  signup,
  signin,
  signout,
  requireSignin,
} = require("../controllers/auth");
const { userSignupValidator } = require("../validator");

router.post(
  "/signup",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please provide a valid email").isEmail(),
    check("password", "Password length must be min 8 characters")
      .not()
      .isEmpty()
      .isLength({ min: 6 }),
    check("password")
      .matches(/\d/)
      .withMessage("Password must contain a number"),
  ],
  signup
);
router.post("/signin", signin);
router.get("/signout", signout);

module.exports = router;
