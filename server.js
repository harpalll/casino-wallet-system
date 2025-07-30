import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import cors from "cors";
import apiRoutes from "./routes/api.js";

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => res.render("index.html"));
app.get("/health", (req, res) => res.json({ msg: "server is healthy." }));

app.use("/api", apiRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to DB");

    app.listen(process.env.PORT, () => {
      console.log(`Server is Running on : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Err in connecting to DB: ${err}`);
  });
