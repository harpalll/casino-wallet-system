import mongoose from "mongoose";

const walletSchema = mongoose.Schema({
  BTC: { address: String, balance: { type: Number, default: 0 } },
  ETH: { address: String, balance: { type: Number, default: 0 } },
  SOL: { address: String, balance: { type: Number, default: 0 } },
  DOGE: { address: String, balance: { type: Number, default: 0 } },
});

const userSchema = mongoose.Schema({
  username: String,
  wallets: walletSchema,
  transcations: [Object],
});

export const User = mongoose.model("User", userSchema);
