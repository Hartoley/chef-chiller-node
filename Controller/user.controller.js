const { adminvalidator } = require("../Middleware/adminvalidator");
const { usermodel } = require("../Model/user.model");
const sendRegistrationEmail = require("../Mailer/signupMail");
const bcrypt = require("bcryptjs");

const usersignup = async (req, res) => {
  try {
    const { username, email, password, phoneNumber } = req.body;

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
      phoneNumber,
    });

    if (!user) {
      return res.status(500).send({
        message: "Unable to save user",
        status: false,
      });
    }

    sendRegistrationEmail(email, username);

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

const userlogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (email === "" || password === "") {
      return res
        .status(405)
        .send({ message: "Input fields cannot be empty", status: false });
    }

    const user = await usermodel.findOne({ email: email });
    if (!user) {
      return res.status(403).send({ message: "User not found", status: false });
    }

    const hashpassword = await bcrypt.compare(password, user.password);
    if (!hashpassword) {
      return res
        .status(401)
        .send({ message: "Invalid password", status: false });
    }

    return res.status(200).send({
      message: "User logged in successfully",
      status: true,
      email,
      role: user.role,
      id: user._id,
    });
  } catch (error) {
    console.log(error);
    return res.status(408).send({ message: "Internal server error" });
  }
};

const getData = async (req, res) => {
  try {
    const data = await usermodel.find({});
    if (data.length === 0) {
      console.log("No data found");
      res.status(404).send({ message: "No data found" });
    } else {
      console.log(data);
      data.forEach((user) => {
        console.log(user.username);
      });
      res.status(200).send(data);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Internal server error" });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await usermodel.findById(id);

    if (!user) {
      return res.status(404).send({
        message: "User not found",
        status: false,
      });
    }

    res.status(200).send({
      message: "User found",
      status: true,
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Internal server error",
      status: false,
    });
  }
};

module.exports = { usersignup, getData, userlogin, getUserById };
