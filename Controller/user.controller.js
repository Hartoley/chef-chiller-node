const { adminvalidator } = require("../Middleware/adminvalidator");
const { usermodel } = require("../Model/user.model");
const sendRegistrationEmail = require("../Mailer/signupMail");

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
  // console.log(req.body);
  try {
    if (email === "" || password === "") {
      return res
        .status(405)
        .send({ message: "input fields cannot be empty", status: false });
    }

    const user = await usermodel.findOne({ email: email });
    if (!user) {
      return res.status(403).send({ message: "user not found", status: false });
    }

    const hashpassword = await bcrypt.compare(password, user.password);
    if (!hashpassword) {
      return res
        .status(401)
        .send({ message: "invalid password", status: false });
    }

    return res.status(200).send({
      message: "user logged in successful",
      status: true,
      useremail,
    });
  } catch (error) {
    console.log(error);
    return res.status(408).send({ message: "internal server error" });
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

module.exports = { usersignup, getData, userlogin };
