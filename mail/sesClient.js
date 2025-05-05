// sesClient.js
const { SESv2Client } = require("@aws-sdk/client-sesv2");

module.exports = new SESv2Client({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
