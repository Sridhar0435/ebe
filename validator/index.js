exports.userSignupValidator = (req, res, next) => {
  req.check("name", "Name is required").notEmpty();
  req
    .check("email", "Please provide a valid email")
    .notEmpty()
    .isEmail()
    .isLength({ min: 6, max: 32 });
  req
    .check("password", "Password length must be min 8 characters")
    .notEmpty()
    .isLength({ min: 8, max: 32 });
  req
    .check("password")
    .matches(/\d/)
    .withMessage("Password must contain a number");

  const errors = req.validationErrors();
  if (errors) {
    const firstError = errors.map((error) => error.error.msg)[0];
    return res.status(400).json({ error: firstError });
  }
  next();
};
