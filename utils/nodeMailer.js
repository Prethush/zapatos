const nodeMailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: "config/config.env" });
const mail = {
  user: "ktmirash49@gmail.com",
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  refreshToken: process.env.REFRESH_TOKEN,
};

const OAuth2_client = new OAuth2(mail.clientId, mail.clientSecret);
OAuth2_client.setCredentials({ refresh_token: mail.refreshToken });

function send_mail(name = "", recipient, otp, index, link) {
  const accessToken = OAuth2_client.getAccessToken();
  const transport = nodeMailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: mail.user,
      clientId: mail.clientId,
      clientSecret: mail.clientSecret,
      refreshToken: mail.refreshToken,
      accessToken: accessToken,
    },
  });
  const mail_options = {
    from: "ktmirash49@gmail.com",
    to: recipient,
    subject: `Verification mail`,
    html:
      index === 0
        ? `<h1>This message is from <span style="color: blue; font-weight: 900;font-style: italic">Zapatos<span> </h1>
    <h2>Your OTP ${otp} </h2>`
        : `<h1>This message is from <span style="color: blue; font-weight: 900;font-style: italic">Zapatos.</span> </h1><h4>You can go to this link <a href=${link}>Link </a>to change your password</h4>`,
  };

  transport.sendMail(mail_options, function (error, result) {
    if (error) {
      console.log(`Error: ${error}`);
    } else {
      console.log(`Success: ${result}`);
    }
    transport.close();
  });
}

module.exports = send_mail;
