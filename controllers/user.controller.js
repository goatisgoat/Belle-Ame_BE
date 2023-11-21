const User = require("../model/User");
const RefreshToken = require("../model/RefreshToken");

const bcrypt = require("bcryptjs");
const saltRounds = 10;

require("dotenv").config();

const userController = {};

userController.createUser = async (req, res) => {
  try {
    const { email, name, password, level } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw new Error("이미 가입 된 유저입니다.");
    }
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashPassword = bcrypt.hashSync(password, salt);

    const newUser = new User({
      email,
      name,
      password: hashPassword,
      level: level ? level : "customer",
    });

    await newUser.save();
    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

userController.loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const isMatch = bcrypt.compareSync(password, user.password);
      if (isMatch) {
        const accessToken = user.generateToken();
        const refreshToken = user.generateRefreshToken();

        const newRefreshToken = new RefreshToken({
          userId: user._id,
          token: refreshToken,
        });

        await newRefreshToken.save();

        return res
          .status(200)
          .json({ status: "success", user, accessToken, refreshToken });
      }
    }
    throw new Error("아이디 또는 비밀번호가 일치하지 않습니다.");
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

userController.loginWithGoogle = async (req, res) => {
  try {
    const { email, name } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = "" + Math.floor(Math.random() * 1000000000);

      const salt = bcrypt.genSaltSync(saltRounds);
      const hashPassword = bcrypt.hashSync(randomPassword, salt);

      user = new User({
        email,
        name,
        password: hashPassword,
        level: "customer",
      });

      await user.save();
    }

    const accessToken = user.generateToken();
    const refreshToken = user.generateRefreshToken();

    const newRefreshToken = new RefreshToken({
      userId: user._id,
      token: refreshToken,
    });

    await newRefreshToken.save();

    return res
      .status(200)
      .json({ status: "success", user, accessToken, refreshToken });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

userController.loginWithKakao = async (req, res) => {
  try {
    const { email, name } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = "" + Math.floor(Math.random() * 1000000000);

      const salt = bcrypt.genSaltSync(saltRounds);
      const hashPassword = bcrypt.hashSync(randomPassword, salt);

      user = new User({
        email,
        name,
        password: hashPassword,
        level: "customer",
      });

      await user.save();
    }

    const accessToken = user.generateToken();
    const refreshToken = user.generateRefreshToken();

    const newRefreshToken = new RefreshToken({
      userId: user._id,
      token: refreshToken,
    });
    await newRefreshToken.save();

    return res
      .status(200)
      .json({ status: "success", user, accessToken, refreshToken });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

//헤더 토큰으로 유저 찾기
userController.getUser = async (req, res) => {
  try {
    const id = req.body.userId;
    const newAccessToken = req.body.newAccessToken;

    const user = await User.findOne({ _id: id });
    if (!user) {
      throw new Error("유저를 찾을 수 없습니다.");
    }

    const status = { status: "success", user };

    if (newAccessToken) status.newAccessToken = newAccessToken;

    res.status(200).json(status);
  } catch (error) {
    res.status(400).json({ status: "fail", error });
  }
};

module.exports = userController;
