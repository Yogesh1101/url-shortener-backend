import express from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { getUserByEmail } from "../controllers/user.js";
import { User, generateToken } from "../models/user.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";


// express router is initialized to router variable and used
const router = express.Router();

dotenv.config();

// login routes
router.post("/login", async (req, res) => {
  try {
    // check user exist or not
    const user = await getUserByEmail(req);
    if (!user) {
      return res.status(404).json({ error: "User does not exists." });
    }
    // validate the password
    const validatePassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validatePassword) {
      return res.status(404).json({ error: "Invalid Credentials." });
    }
    if (user.status === "Not Verified") {
      return res.status(404).json({ error: "Email does not activated." });
    }
    const token = generateToken(user._id);
    res.status(200).json({ message: "Logged in Successfully.", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error." });
  }
});

// signup routes
router.post("/signup", async (req, res) => {
  try {
    // check user already exist
    let user = await getUserByEmail(req);
    if (user) {
      return res.status(400).json({ error: "User Already Exists" });
    }

    // generate hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // storing the email and password in User
    user = await new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
      status: "Not Verified",
    }).save();

    const token = generateToken(user._id);

    // generating a random string consist of some token and secret key
    const secret = process.env.SECRET_KEY + user.password;
    const token1 = jwt.sign({ email: user.email, id: user._id }, secret, {
      expiresIn: "10m",
    });

    // this is sent to the user via mail when they submit the email in forgor page
    const link = `https://url-shortener-backend-ab7t.onrender.com/user/account-activate/${user._id}/${token1}`;

    // This is the part to sent and email to user
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    var mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Account Activation Link",
      text: link,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    res.status(201).json({
      message: "Account Activation Link is send to your mail.",
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error." });
  }
});

// forgot-password routes
router.post("/forgot-password", async (req, res) => {
  try {
    // check user already exists
    const user = await getUserByEmail(req);
    if (!user) {
      return res.status(404).json({ error: "User does not exists." });
    }
    // generating a random string consist of some token and secret key
    const secret = process.env.SECRET_KEY + user.password;
    const token = jwt.sign({ email: user.email, id: user._id }, secret, {
      expiresIn: "5m",
    });

    // this is sent to the user via mail when they submit the email in forgor page
    const link = `https://url-shortener-backend-ab7t.onrender.com/user/reset-password/${user._id}/${token}`;

    // This is the part to sent and email to user
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    var mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Password Reset Link",
      text: link,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    res.status(200).json({ message: "Logged in Successfully.", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error." });
  }
});

// get account-activate routes
router.get("/account-activate/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  // check user already exists by id
  const user = await User.findOne({ _id: id });
  if (!user) {
    return res.status(404).json({ error: "User does not exists." });
  }
  // verifying the random string which is sent via email using jwt
  const secret = process.env.SECRET_KEY + user.password;
  try {
    const verify = jwt.verify(token, secret);
    // This load the html file where the form is displayed to enter new password
    res.render("index1", { email: verify.email, status: "Not Verified" });
  } catch (error) {
    res.send("Not Verified");
    console.log(error);
  }
});

// post account-activate routes
router.post("/account-activate/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  // checking whether the new password and confirm password is same
  // check user is exits
  const user = await User.findOne({ _id: id });
  if (!user) {
    return res.status(404).json({ error: "User does not exists." });
  }
  const secret = process.env.SECRET_KEY + user.password;
  try {
    const verify = jwt.verify(token, secret);
    await User.updateOne({ _id: id }, { $set: { status: "Verified" } });
    // This load the html file where the form is displayed to enter new password
    res.render("index1", { email: verify.email, status: "verified" });
  } catch (error) {
    res.json({ status: "Something went wrong" });
    console.log(error);
  }
});

// get reset-password routes
router.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  // check user already exists by id
  const user = await User.findOne({ _id: id });
  if (!user) {
    return res.status(404).json({ error: "User does not exists." });
  }
  // verifying the random string which is sent via email using jwt
  const secret = process.env.SECRET_KEY + user.password;
  try {
    const verify = jwt.verify(token, secret);
    // This load the html file where the form is displayed to enter new password
    res.render("index", { email: verify.email, status: "Not Verified" });
  } catch (error) {
    res.send("Not Verified");
    console.log(error);
  }
});

// post reset-password routes
router.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;
  // checking whether the new password and confirm password is same
  // check user is exits
  const user = await User.findOne({ _id: id });
  if (!user) {
    return res.status(404).json({ error: "User does not exists." });
  }
  const secret = process.env.SECRET_KEY + user.password;
  try {
    const verify = jwt.verify(token, secret);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await User.updateOne({ _id: id }, { $set: { password: hashedPassword } });
    // This load the html file where the form is displayed to enter new password
    res.render("index", { email: verify.email, status: "verified" });
  } catch (error) {
    res.json({ status: "Something went wrong" });
    console.log(error);
  }
});



export const userRouter = router;
