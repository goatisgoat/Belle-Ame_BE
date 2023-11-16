const jwt = require("jsonwebtoken");
const User = require("../model/User");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();
const authController = {};

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

authController.authenticate = (req, res, next) => {
  try {
    const tokenString = req.headers.authorization;
    if (!tokenString) {
      throw new Error("invaild token");
    }
    const token = tokenString.replace("Bearer ", "");
    jwt.verify(token, JWT_SECRET_KEY, (error, payload) => {
      if (error) throw new Error("invaild token");
      req.body.userId = payload._id;
    });
    next();
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

authController.authGoogle = async (req, res, next) => {
  try {
    const { code } = req.body;

    const oAuth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      "postmessage"
    );

    const { tokens } = await oAuth2Client.getToken(code);

    const userInfoResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    const { email, name } = userInfoResponse.data;

    req.body.email = email;
    req.body.name = name;

    next();
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

authController.authKakao = async (req, res, next) => {
  try {
    const { code } = req.body;

    const KAKAO_OAUTH_TOKEN_API_URL = "https://kauth.kakao.com/oauth/token";
    const grant_type = "authorization_code";

    const response = await axios.post(
      `${KAKAO_OAUTH_TOKEN_API_URL}?grant_type=${grant_type}&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}&code=${code}`,
      {
        headers: {
          "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      }
    );

    const { access_token } = response.data;

    const kakaoUser = await axios.get(`https://kapi.kakao.com/v2/user/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const email = kakaoUser.data.kakao_account.email;
    const name = kakaoUser.data.properties.nickname;

    req.body.email = email;
    req.body.name = name;

    next();
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

authController.checkAdminPermission = async (req, res, next) => {
  try {
    const id = req.body.userId;
    const user = await User.findById(id);

    if (user.level !== "admin") throw new Error("no permission");

    next();
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

module.exports = authController;
