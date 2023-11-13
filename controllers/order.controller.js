const Order = require("../model/Order");
const productController = require("./product.controller");
const { randomString } = require("../utils/randomString");

const orderController = {};

orderController.createOrder = async (req, res) => {
  try {
    const id = req.body.userId;

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
    res.status(200).json({ status: "success", orderNum: newOrder.orderNum });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

orderController.getOrder = async (req, res) => {
  try {
    const id = req.body.userId;

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

    res.status(200).json({ status: "success", order });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

orderController.getAllUsersOrder = async (req, res) => {
  try {
    const { page, name, PAGE_SIZE } = req.query;

    console.log(page, name, PAGE_SIZE);

    let response = { status: "success" };

    let cond = name ? { orderNum: { $regex: name, $options: "i" } } : {};

    console.log(cond, "cond");
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

      console.log(totalDivided, "totalDivided");
      response.totalPageNum = totalDivided;
    }

    const allUsersOrder = await query.exec();

    if (!allUsersOrder) {
      throw new Error("주문목록이 존재하지 않습니디.");
    }
    response.allUsersOrder = allUsersOrder;
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

orderController.updateOrderStatus = async (req, res) => {
  try {
    const { status, orderId } = req.body;

    const order = await Order.updateOne(
      { _id: orderId },
      { $set: { status: status } }
    );

    if (!order) {
      throw new Error("주문목록이 존재하지 않습니디.");
    }

    res.status(200).json({ status: "success", order });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

module.exports = orderController;
