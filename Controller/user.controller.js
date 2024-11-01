const { adminvalidator } = require("../Middleware/adminvalidator");
const { usermodel } = require("../Model/user.model");

const usersignup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password || !email || !phoneNumber) {
      return res.status(400).send({
        message: "Input fields cannot be empty",
        status: false,
      });
    }

    try {
      await adminvalidator.validate(req.body);
    } catch (err) {
      return res.status(400).send({
        message: "Invalid input data",
        status: false,
      });
    }

    const [existingUsername, existingUser] = await Promise.all([
      usermodel.findOne({ username }),
      usermodel.findOne({ email }),
    ]);

    if (existingUsername) {
      return res.status(409).send({
        message: "Username already exists, kindly pick another one",
        status: false,
      });
    }

    if (existingUser) {
      return res.status(409).send({
        message: "Email already registered",
        status: false,
      });
    }

    const user = await usermodel.create({
      username,
      email,
      password,
      phonoNumber,
    });

    if (!user) {
      return res.status(500).send({
        message: "Unable to save user",
        status: false,
      });
    }

    return res.status(201).send({
      message: "User signed up successfully",
      status: true,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(409).send({
        message: "Duplicate entry: Email already exists",
      });
    }
    return res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = { usersignup };
