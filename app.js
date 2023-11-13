const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const indexRputer = require("./router/index");

require("dotenv").config();
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/api", indexRputer);

const mongoURI = process.env.MONGODB_URI;

mongoose
  .connect(mongoURI, { useNewUrlParser: true })
  .then(() => console.log("mongoDB connected"))
  .catch((err) => console.log(err));

app.listen(process.env.PORT || 4000, () => console.log("server connected"));
