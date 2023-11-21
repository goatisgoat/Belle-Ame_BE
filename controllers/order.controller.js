const Order = require("../model/Order");
const productController = require("./product.controller");
const { randomString } = require("../utils/randomString");

const orderController = {};

orderController.createOrder = async (req, res) => {
  try {
    const id = req.body.userId;
    const newAccessToken = req.body.newAccessToken;

    const { totalPrice, shipTo, contact, orderList } = req.body;

    const insufficientStockItem = await productController.checkItemListStock(
      orderList
    );

    if (insufficientStockItem.length > 0) {
      const errorMessage = insufficientStockItem.reduce((total, item) => {
        total.push({ message: item.message });
        return total;
      }, []);

      throw new Error(JSON.stringify(errorMessage));
    }

    const newOrder = new Order({
      userId: id,
      totalPrice,
      shipTo,
      contact,
      items: orderList,
      orderNum: randomString(),
    });

    await newOrder.save();

    const status = {
      status: "success",
      orderNum: newOrder.orderNum,
    };
    if (newAccessToken) status.newAccessToken = newAccessToken;

    res.status(200).json(status);
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

orderController.getOrder = async (req, res) => {
  try {
    const id = req.body.userId;
    const newAccessToken = req.body.newAccessToken;

    const order = await Order.find({ userId: id })
      .populate({
        path: "items",
        populate: {
          path: "productId",
          model: "Product",
        },
      })
      .sort({ createdAt: -1 });

    if (!order) {
      throw new Error("주문목록이 존재하지 않습니디.");
    }

    const status = {
      status: "success",
      order,
    };
    if (newAccessToken) status.newAccessToken = newAccessToken;

    res.status(200).json(status);
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

orderController.getAllUsersOrder = async (req, res) => {
  try {
    const newAccessToken = req.body.newAccessToken;

    const { page, name, PAGE_SIZE } = req.query;

    let status = { status: "success" };

    let cond = name ? { orderNum: { $regex: name, $options: "i" } } : {};

    let query = Order.find(cond)
      .populate({
        path: "items",
        populate: {
          path: "productId",
          model: "Product",
        },
      })
      .populate({
        path: "userId",
      })
      .sort({ createdAt: -1 });

    if (page) {
      query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);

      const totalPageNum = await Order.find(cond).count();
      const totalDivided = Math.ceil(totalPageNum / PAGE_SIZE);

      status.totalPageNum = totalDivided;
    }

    const allUsersOrder = await query.exec();

    if (!allUsersOrder) {
      throw new Error("주문목록이 존재하지 않습니디.");
    }
    status.allUsersOrder = allUsersOrder;

    //에러핸들링

    if (newAccessToken) status.newAccessToken = newAccessToken;

    res.status(200).json(status);
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

orderController.updateOrderStatus = async (req, res) => {
  try {
    const orderStatus = req.body.status;
    const orderId = req.body.orderId;
    const newAccessToken = req.body.newAccessToken;

    const order = await Order.updateOne(
      { _id: orderId },
      { $set: { status: orderStatus } }
    );

    if (!order) {
      throw new Error("주문목록이 존재하지 않습니디.");
    }

    const status = {
      status: "success",
      order,
    };
    if (newAccessToken) status.newAccessToken = newAccessToken;

    res.status(200).json(status);
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

module.exports = orderController;
