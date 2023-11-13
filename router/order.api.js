const express = require("express");
const authController = require("../controllers/auth.controller");
const orderController = require("../controllers/order.controller");
const router = express.Router();

router.post("/", authController.authenticate, orderController.createOrder);
router.get("/", authController.authenticate, orderController.getOrder);
router.get(
  "/total",
  authController.authenticate,
  authController.checkAdminPermission,
  orderController.getAllUsersOrder
);

router.put(
  "/",
  authController.authenticate,
  authController.checkAdminPermission,
  orderController.updateOrderStatus
);

module.exports = router;
