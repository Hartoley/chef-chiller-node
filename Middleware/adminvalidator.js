const yup = require("yup");
const emailregex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

const adminvalidator = yup.object().shape({
  username: yup.string().min(5, "username must not be less than 5 characters"),
  email: yup
    .string()
    .required(true, "email is required")
    .matches(emailregex, "email must be valid"),
  password: yup
    .string()
    .min(5, "password is too short")
    // .matches(
    //   `^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-])`,
    //   "password must have at least one capital letter, an integer and a special character"
    // )
    .required("password is required"),
});

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else {
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { adminvalidator, errorHandler };
