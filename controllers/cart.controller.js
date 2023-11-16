const Cart = require("../model/Cart");

const cartController = {};

cartController.createItemCart = async (req, res) => {
  try {
    const id = req.body.userId;

    const { productId, size, qty } = req.body;

    let cart = await Cart.findOne({ userId: id });

    if (!cart) {
      cart = new Cart({ userId: id });

      await cart.save();
    }

    const existItem = cart.items.find((item) => {
      return item.productId.equals(productId) && item.size === size;
    });

    if (existItem) {
      throw new Error("아이템이 이미 카트에 담겨 있습니다.");
    }

    cart.items = [...cart.items, { productId, size, qty }];

    await cart.save();

    res
      .status(200)
      .json({ status: "success", cart, cartItemLength: cart.items.length });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

cartController.getCartItem = async (req, res) => {
  try {
    const id = req.body.userId;

    const cart = await Cart.findOne({ userId: id }).populate({
      path: "items",
      populate: {
        path: "productId",
        model: "Product",
      },
    });

    if (!cart) {
      throw new Error("아이템이 존재하지 않습니디.");
    }

    res.status(200).json({ status: "success", cart });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

cartController.updateItem = async (req, res) => {
  try {
    const id = req.body.userId;

    const { cartId, type } = req.body;

    const filter = { userId: id };
    const updatePlus = { $inc: { "items.$[element].qty": 1 } };
    const updateMinus = { $inc: { "items.$[element].qty": -1 } };

    const options = {
      arrayFilters: [{ "element._id": cartId }],
    };

    let result;

    if (type === "plus") {
      result = await Cart.updateOne(filter, updatePlus, options);
    } else if (type === "minus") {
      result = await Cart.updateOne(filter, updateMinus, options);
    }

    if (!result) {
      throw new Error("업데이트에 실패했습니다.");
    }

    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

cartController.deleteItem = async (req, res) => {
  try {
    const id = req.body.userId;

    const { cartId } = req.body;

    const filter = { userId: id };

    const update = {
      $pull: { items: { _id: cartId } },
    };

    const result = await Cart.updateOne(filter, update);
    if (!result) {
      throw new Error("업데이트에 실패했습니다.");
    }

    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

cartController.getCartItemLength = async (req, res) => {
  try {
    const id = req.body.userId;

    const cart = await Cart.findOne({ userId: id });

    if (!cart) {
      throw new Error("아이템이 존재하지 않습니디.");
    }

    res.status(200).json({ status: "success", cartLength: cart.items.length });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

module.exports = cartController;
