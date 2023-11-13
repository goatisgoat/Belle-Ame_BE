const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = require("./User");
const Product = require("./Product");
const Cart = require("./Cart");

const orderSchema = Schema(
  {
    userId: { type: mongoose.ObjectId, ref: User },
    status: { type: String, default: "panding" },
    totalPrice: { type: Number, required: true },
    shipTo: { type: Object, required: true },
    contact: { type: Object, required: true },
    orderNum: { type: String, required: true },
    items: [
      {
        productId: { type: mongoose.ObjectId, ref: Product },
        size: { type: String, required: true },
        qty: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.__v;
  delete obj.updatedAt;

  return obj;
};

orderSchema.post("save", async function () {
  const cart = await Cart.findOne({ userId: this.userId });
  cart.items = [];
  await cart.save();
});
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
