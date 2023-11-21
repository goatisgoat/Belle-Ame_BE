const jwt = require("jsonwebtoken");
const User = require("../model/User");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");
const RefreshToken = require("../model/RefreshToken");
require("dotenv").config();
const authController = {};

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

authController.authenticate = async (req, res, next) => {
  try {
    const accessToken = req.headers["access-token"];
    const refreshToken = req.headers["refresh-token"];

    let accessString = accessToken.replace("Bearer ", "");
    const refreshString = refreshToken.replace("Bearer ", "");

    //서버에서 확인
    const tokenDBResult = await RefreshToken.findOne({
      token: refreshString,
    });

    if (!tokenDBResult) {
      const error = new Error("토큰값이 일치하지 않습니다.");
      error.statusCode = 401;
      throw error;
    }

    //테스트///////
    // 유효성 검증
    const isAccessTokenValid = authController.validateAccessToken(accessString);
    const isRefreshTokenValid =
      authController.validateRefreshToken(refreshString);

    if (!isRefreshTokenValid) {
      const error = new Error("로그인 후 이용햐주세요.");
      error.statusCode = 419;
      throw error;
    }

    //토큰 재발급
    if (!isAccessTokenValid) {
      accessString = authController.createNewAccessToken(tokenDBResult.userId);

      req.body.newAccessToken = accessString;
    }

    //유저 아이디 넘겨주기
    jwt.verify(accessString, JWT_SECRET_KEY, (error, payload) => {
      if (error) {
        const error = new Error("로그인 후 이용햐주세요.");
        error.statusCode = 419;
        throw error;
      }
      req.body.userId = payload._id;
    });

    next();
  } catch (error) {
    res
      .status(401)
      .json({ status: "fail", error: error.message, code: error.statusCode });
  }
};

// Access Token
authController.validateAccessToken = (accessToken) => {
  try {
    jwt.verify(accessToken, JWT_SECRET_KEY);
    return true;
  } catch (error) {
    return false;
  }
};

// Refresh Token
authController.validateRefreshToken = (refreshToken) => {
  try {
    jwt.verify(refreshToken, JWT_SECRET_KEY);
    return true;
  } catch (error) {
    return false;
  }
};

//New Access Token 생성
authController.createNewAccessToken = (id) => {
  const accessToken = jwt.sign({ _id: id }, JWT_SECRET_KEY, {
    expiresIn: "10s",
  });

  return accessToken;
};

authController.deleteToken = async (req, res) => {
  try {
    const refreshToken = req.headers["refresh-token"];
    const refreshString = refreshToken.replace("Bearer ", "");

    const response = await RefreshToken.deleteOne({
      token: refreshString,
    });

    if (!response) {
      throw new Error("토큰이 존재하지 않습니다.");
    }

    res.status(200).json({ status: "success" });
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
    const newAccessToken = req.body.newAccessToken;

    const user = await User.findById(id);

    if (user.level !== "admin") throw new Error("no permission");

    if (newAccessToken) req.body.newAccessToken = newAccessToken;
    next();
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

module.exports = authController;
