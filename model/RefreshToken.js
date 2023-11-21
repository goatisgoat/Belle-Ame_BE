const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = require("./User");

const tokenSchema = Schema({
  userId: {
    type: mongoose.ObjectId,
    required: true,
    ref: User,
  },
  token: {
    type: String,
    required: true,
  },
  expireAt: {
    type: Date,
    default: Date.now,
    index: { expires: 60 * 60 * 24 },
  },
});

const RefreshToken = mongoose.model("tokens", tokenSchema);
module.exports = RefreshToken;
