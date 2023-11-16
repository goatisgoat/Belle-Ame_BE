const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authController = require("../controllers/auth.controller");

router.post("/", userController.createUser);
router.post("/login", userController.loginWithEmail);
router.post(
  "/google",
  authController.authGoogle,
  userController.loginWithGoogle
);
router.post("/kakao", authController.authKakao, userController.loginWithKakao);

router.get("/auth/me", authController.authenticate, userController.getUser);

module.exports = router;
