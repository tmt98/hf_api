"use strict";

const { Wallets } = require("fabric-network");
const path = require("path");
const fs = require("fs");

const util = require("util");
const FabricCAServices = require("fabric-ca-client");

// GET CCP:
const getCCP = async (org) => {
  let ccpPath;
  if (org == "Org1") {
    ccpPath = path.resolve(__dirname, "..", "config", "connection-org1.json");
  } else if (org == "Org2") {
    ccpPath = path.resolve(__dirname, "..", "config", "connection-org2.json");
  } else return null;
  const ccpJSON = fs.readFileSync(ccpPath, "utf8");
  const ccp = JSON.parse(ccpJSON);
  return ccp;
};

// GET CA URL:
const getCaUrl = async (org, ccp) => {
  let caURL;
  if (org == "Org1") {
    caURL = ccp.certificateAuthorities["ca.org1.example.com"].url;
  } else if (org == "Org2") {
    caURL = ccp.certificateAuthorities["ca.org2.example.com"].url;
  } else return null;
  return caURL;
};

// GET WALLET:
const getWalletPath = async (org, channel) => {
  let walletPath;
  if (org == "Org1") {
    walletPath = path.join(process.cwd(), "./wallet/Org1");
  } else if (org == "Org2") {
    walletPath = path.join(process.cwd(), "./wallet/Org2");
  } else return null;
  return walletPath;
};

// GET AFFILIANTION
const getAffiliantion = async (org) => {
  return org == "Org1" ? "org1.department1" : "org2.department1";
};

// GET REGISTER USER
const getRegisterUser = async (username, userOrg, channel, isJson) => {
  let ccp = await getCCP(userOrg);
  const caURL = await getCaUrl(userOrg, ccp);
  const ca = new FabricCAServices(caURL);

  const walletPath = await getWalletPath(userOrg, channel);
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  console.log(wallet);

  const userIdentity = await wallet.get(username);
  if (userIdentity) {
    console.log(
      `An identity for the user ${username} already exists in the wallet`
    );
    var respone = {
      success: true,
      message: username + " endrolled Successfully",
    };
    return respone;
  }
  let adminIdentity = await wallet.get("admin");
  if (!adminIdentity) {
    console.log(
      "An identity for the admin user 'admin' does not exist in the wallet"
    );
    await enrollAdmin(userOrg, ccp, channel);
    adminIdentity = await wallet.get("admin");
    console.log("Admin Enrolled Successfully");
  }

  // build a user object for authenticating with the CA
  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, "admin");
  let secret;
  try {
    secret = await ca.register(
      {
        affiliation: await getAffiliantion(userOrg),
        enrollmentID: username,
        role: "client",
        attrs: [{ name: "channel", value: channel, ecert: true }],
      },
      adminUser
    );
  } catch (error) {
    return error.message;
  }

  const enrollment = await ca.enroll({
    enrollmentID: username,
    enrollmentSecret: secret,
    attr_reqs: [{ name: "channel" }],
  });

  let x509Identity;
  if (userOrg == "Org1") {
    x509Identity = {
      credentials: {
        credentials: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      channel: channel,
      mspId: "Org1MSP",
      type: "X.509",
    };
  } else if (userOrg == "Org2") {
    x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      channel: channel,
      mspId: "Org2MSP",
      type: "X.509",
    };
  }

  await wallet.put(username, x509Identity);
  console.log(
    `Successfully registered and enrolled admin user ${username} and imported it into the wallet`
  );
  var respone = {
    success: true,
    message: username + " enrolled Successfully",
  };
  return respone;
};

const isUserRegistered = async (username, userOrg, channel) => {
  const walletPath = await getWalletPath(userOrg, channel);
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  // console.log(`Wallet path: ${walletPath}`);

  const userIdentity = await wallet.get(username);
  if (userIdentity) {
    console.log(`An identity for the user ${username} exists in the wallet`);
    return true;
  }
  return false;
};

const getCaInfo = async (org, ccp) => {
  let caInfo;
  if (org == "Org1") {
    caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
  } else if (org == "Org2") {
    caInfo = ccp.certificateAuthorities["ca.org2.example.com"];
  } else return null;
  return caInfo;
};

const enrollAdmin = async (org, ccp, channel) => {
  console.log("calling enroll Admin method");

  try {
    const caInfo = await getCaInfo(org, ccp);
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName
    );
    const walletPath = await getWalletPath(org, channel);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // ???
    const identity = await wallet.get("admin");
    if (identity) {
      console.log(
        "An identity for the admin user 'admin' already exists in the wallet"
      );
      return;
    }

    const enrollment = await ca.enroll({
      enrollmentID: "admin",
      enrollmentSecret: "adminpw",
    });
    console.log(enrollment);
    let x509Identity;
    if (org == "Org1") {
      x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: "Org1MSP",
        type: "X.509",
      };
    } else if (org == "Org2") {
      x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: "Org2MSP",
        type: "X.509",
      };
    }

    await wallet.put("admin", x509Identity);
    console.log(
      'Successfully enrolled admin user "admin" and imported it into the wallet'
    );
    return;
  } catch (error) {
    console.error(`Failed to enroll admin user "admin": ${error}`);
  }
};

exports.getRegisterUser = getRegisterUser;

module.exports = {
  getCCP: getCCP,
  getWalletPath: getWalletPath,
  getRegisterUser: getRegisterUser,
  isUserRegistered: isUserRegistered,
};
