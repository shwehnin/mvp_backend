require("dotenv").config();
const cors = require("cors");
const path = require("path");
const express = require("express");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/api', require("./routes/api_routes"));

module.exports = app;