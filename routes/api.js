import { Router } from "express";
import { User } from "../models/User.js";
const router = Router();

const addresses = {
  BTC: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  ETH: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
  SOL: "7Z2W3G9Vq1e6m5vK1bX4k2J3Q4L5M6N7P8Q9R",
  DOGE: "D6oQeY8m5vK1bX4k2J3Q4L5M6N7P8Q9R",
};

const casino = {
  BTC: {
    address: "3EktnHQD7RiAE6uzMj2ZifT9YgRrkSgzQX",
    balance: 10,
  },
  ETH: {
    address: "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
    balance: 100,
  },
  SOL: {
    address: "8Yv1N6K3Q4L5M6N7P8Q9R1S2T3U4V5W6X7Y",
    balance: 1000,
  },
  DOGE: {
    address: "D9wfpqM5vK1bX4k2J3Q4L5M6N7P8Q9R",
    balance: 10000,
  },
};

// middlewares
const authMiddleware = async (req, res, next) => {
  if (req.headers.username) {
    next();
  } else {
    return res.status(403).json({
      msg: "unauthenticated",
    });
  }
};

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.create({
      username,
      password,
      wallets: {
        BTC: { address: addresses.BTC },
        ETH: { address: addresses.ETH },
        SOL: { address: addresses.SOL },
        DOGE: { address: addresses.DOGE },
      },
    });

    if (user) {
      return res.status(200).json({
        msg: "User created successfully.",
        user,
      });
    }
  } catch (error) {
    return res.status(404).json({
      msg: "Error in registering the user.",
      error,
    });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });

    if (user) {
      return res.status(200).json({
        msg: "Logged in successfully.",
        user,
      });
    } else {
      return res.status(400).json({
        msg: "Invalid Credentials.",
      });
    }
  } catch (error) {
    return res.status(404).json({
      msg: "Error in registering the user.",
      error,
    });
  }
});

router.post("/deposit", authMiddleware, async (req, res) => {
  const { username, currency, amount } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user) {
      //   const userBalance = user.wallets[currency].balance;
      //   console.log(
      //     `Fetched Wallet: ${username} For Currency: ${currency} Balance: ${
      //       user.wallets[currency].balance
      //     } Depositing: ${amount} Final Balance: ${
      //       user.wallets[currency].balance + amount
      //     }`
      //   );

      user.wallets[currency].balance += amount;
      user.transcations.push({
        type: "Deposit",
        currency,
        amount,
      });

      await user.save();

      return res.status(200).json({
        msg: `${amount} in ${username} deposited successfully.`,
        currencyInWallet: user.wallets[currency],
      });
    }
  } catch (error) {
    return res.status(404).json({
      msg: "Error in fetching the user.",
      error,
    });
  }
});

router.post("/play", authMiddleware, async (req, res) => {
  const { username, currency, amount } = req.body;
  const bet = Number(amount);

  try {
    const user = await User.findOne({ username });
    const userBalance = user.wallets[currency].balance;

    if (user) {
      if (bet > userBalance) {
        return res.status(400).json({
          msg: "Insufficient Balance for bet.",
          balance: userBalance,
        });
      }

      //   logic for game won or lost
      const result = Math.random() < 0.5 ? "won" : "lost";

      user.wallets[currency].balance += result === "won" ? bet * 2 : -bet;
      //   const userBalance = user.wallets[currency].balance;
      //   console.log(
      //     `Fetched Wallet: ${username} For Currency: ${currency} Balance: ${
      //       user.wallets[currency].balance
      //     } Result: ${result} Final Balance: ${
      //       result === "won"
      //         ? user.wallets[currency].balance + bet * 2
      //         : user.wallets[currency].balance + -bet
      //     }`
      //   );

      user.transcations.push({
        type: "Game",
        result,
        bet: amount,
      });

      await user.save();

      return res.status(200).json({
        msg: `${result} - Bet: ${amount}`,
        result,
        currencyInWallet: user.wallets[currency],
      });
    }
  } catch (error) {
    return res.status(404).json({
      msg: "Error in fetching the user.",
      error,
    });
  }
});

router.post("/withdraw", authMiddleware, async (req, res) => {
  const { username, currency, amount } = req.body;
  const amountToBeWithDrawn = Number(amount);

  try {
    const user = await User.findOne({ username });

    if (user) {
      const userBalance = user.wallets[currency].balance;
      const casinoBalance = casino[currency].balance;

      if (amountToBeWithDrawn <= userBalance) {
        user.wallets[currency].balance -= amountToBeWithDrawn;
      } else {
        // amount that is greater than user's balance.
        const shortFall = amountToBeWithDrawn - userBalance;

        if (shortFall > casinoBalance) {
          return res.status(500).json({
            msg: "Sorry! Casino Has Insufficient Funds.",
          });
        }

        user.wallets[currency].balance = 0;
        casino[currency].balance -= shortFall;

        console.log(
          `Withdrawing From Casino's Balance: shortFall: ${shortFall}, balance: ${casino[currency].balance}`
        );
      }

      user.transcations.push({
        type: "WithDraw",
        currency,
        amount,
      });

      await user.save();

      return res.status(200).json({
        msg: `${amount} is withdrawn successfully.`,
        currencyInWallet: user.wallets[currency],
      });
    }
  } catch (error) {
    return res.status(404).json({
      msg: "Error in fetching the user.",
      error,
    });
  }
});

router.get("/balance", authMiddleware, async (req, res) => {
  const { username } = req.query;

  try {
    const user = await User.findOne({ username });

    if (user) {
      return res.status(200).json({
        msg: "Balance Fetched Successfully.",
        balance: user.wallets,
      });
    }
  } catch (error) {
    return res.status(404).json({
      msg: "Error in fetching the user's balance.",
      error,
    });
  }
});

router.get("/transactions", authMiddleware, async (req, res) => {
  const { username } = req.query;

  try {
    const user = await User.findOne({ username });

    if (user) {
      return res.status(200).json({
        msg: "Transactions Fetched Successfully.",
        transcations: user.transcations,
      });
    }
  } catch (error) {
    return res.status(404).json({
      msg: "Error in fetching the user's transcations.",
      error,
    });
  }
});

export default router;
