"use strict";

const dotenv = require("dotenv");
dotenv.config();

const log4js = require("log4js");
const logger = log4js.getLogger("APP.JS");

const express = require("express");
const fileupload = require("express-fileupload");
const session = require("express-session");

const http = require("http");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan")("dev");
const bodyParser = require("body-parser");

const expressJWT = require("express-jwt");
const jwt = require("jsonwebtoken");
const bearerToken = require("express-bearer-token");
const constants = require("./config/constans.json");

// Set host/port
const host = process.env.HOST || constants.host;
const port = process.env.PORT || constants.port;

// Set up ACAO
const app = express();
app.use(fileupload({ useTempFiles: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});
app.options("*", cors());
app.use(cors());
app.use(morgan);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
// app.use(
//   session({
//     secret: "LuanVan",
//     cookie: { maxAge: 60000 },
//     saveUninitialized: false,
//   })
// );
app.set("secret", "mysecret");
app.use(
  expressJWT({
    secret: "mysecret",
    algorithms: ["HS256"],
  }).unless({
    path: ["/api/auth", "/api/auth/register", "/api/auth/getkey"],
  })
);
app.use(bearerToken());
logger.level = "debug";

// --> Add routes
app.use("/public", express.static("public"));

app.use("/api/auth", require("./routes/auth.route"));

app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

const server = http.createServer(app).listen(port, () => {
  console.log("SERVER STARTED ON LOCALHOST:9999");
});
logger.info("********** SERVER START **************************");
logger.info("********** http://%s:%s *****************", host, port);
