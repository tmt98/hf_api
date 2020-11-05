"use strict";

const express = require("express");
const controller = require("../controllers/auth.controller");

const router = express.Router();
// ROUTER GET
router.get("/register", controller.register);
router.get("/getkey", controller.getKey);

// ROUTER POST

module.exports = router;
