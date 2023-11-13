const express = require("express");
const cartController = require("../controllers/cart.controller");
const authController = require("../controllers/auth.controller");
const router = express.Router();

router.post("/", authController.authenticate, cartController.createItemCart);
router.get("/", authController.authenticate, cartController.getCartItem);
router.get(
  "/qty",
  authController.authenticate,
  cartController.getCartItemLength
);

router.put("/update", authController.authenticate, cartController.updateItem);
router.put("/delete", authController.authenticate, cartController.deleteItem);

module.exports = router;
