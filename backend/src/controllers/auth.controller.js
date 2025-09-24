import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { email, fullName, password } = req.body;

  try {
    if (!email || !fullName || !password) {
      return res.status(400).send("All fields are required");
    }

    if (password.length < 6) {
      return res.status(400).send("Password must be at least 6 characters");
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).send("User already exists");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ email, fullName, password: hashedPassword });

    if (newUser) {
      //generate jwt token
      generateToken(newUser._id, res);
      await newUser.save();

      return res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        ProfilePicture: newUser.ProfilePicture,
      });
    } else {
      return res.status(400).send("Invalid user data");
    }
  } catch (error) {
    console.log("error in signup: ", error.message);
    res.status(500).send("Internal server error");
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).send("All fields are required");
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(400).send("Invalid credentials");
    }

    await bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(400).send("Invalid credentials");
      }
      if (result) {
        generateToken(user._id, res);
        return res.status(200).json({
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          ProfilePicture: user.ProfilePicture,
        });
      } else {
        return res.status(400).send("Invalid credentials");
      }
    });
  } catch (error) {
    console.log("error in login: ", error.message);
    res.status(500).send("Internal server error");
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    return res.status(200).send("Logged out successfully");
  } catch (error) {
    console.log("error in logout: ", error.message);
    res.status(500).send("Internal server error");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ProfilePicture: uploadResponse.secure_url },
      { new: true }
    );
    console.log("Updated user: ", updatedUser);

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in updateProfile: ", error.message);
    res.status(500).send("Internal server error");
  }
};

export const checkAuth = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
