"use strict";

const FabricCAServices = require("fabric-ca-client");
const { Wallets } = require("fabric-network");
const fs = require("fs");
const yaml = require("js-yaml");
const jwt = require("jsonwebtoken");
const log4js = require("log4js");
const logger = log4js.getLogger("APP.JS");
const helper = require("../helper/helper");
const constants = require("../config/constans.json");

const getErrorMessage = (field) => {
  let respone = {
    success: false,
    message: field + " field is missing or Invalid in the request",
  };
  return respone;
};

module.exports.register = async (req, res) => {
  const { body } = req;
  const { username, orgName, channel } = body;
  logger.debug(
    "Username: " + username + " || Org: " + orgName + " || Channel: " + channel
  );
  if (!username) {
    res.json(getErrorMessage("'username'"));
    return;
  }
  if (!orgName) {
    res.json(getErrorMessage("'orgName'"));
    return;
  }
  if (!channel) {
    res.json(getErrorMessage("'channel'"));
    return;
  }
  // let token = jwt.sign({});

  let response = await helper.getRegisterUser(username, orgName, channel, true);
  if (response && typeof response !== "string") {
    res.json({ success: true, message: response });
  } else {
    res.json({ success: false, message: response });
  }
};

module.exports.getKey = async (req, res) => {
  const { body } = req;
  const { username, orgName, channel } = body;
  logger.debug(
    "Username: " + username + " || Org: " + orgName + " || Channel: " + channel
  );
  if (!username) {
    res.json(getErrorMessage("'username'"));
    return;
  }
  if (!orgName) {
    res.json(getErrorMessage("'orgName'"));
    return;
  }
  if (!channel) {
    res.json(getErrorMessage("'channel'"));
    return;
  }
  let token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expresstime),
      username: username,
      orgName: orgName,
      channel: channel,
    },
    "mysecret"
  );
  let isUserRegistered = await helper.isUserRegistered(
    username,
    orgName,
    channel
  );

  if (isUserRegistered) {
    res.json({
      success: true,
      message: { token: token },
    });
  } else {
    res.json({
      success: false,
      message: `${username} is not registered with ${orgName} on channel ${channel}`,
    });
  }
};
