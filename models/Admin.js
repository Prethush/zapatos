const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config({ path: "../config/config.env" });

const adminSchema = new Schema(
  {
    email: { type: String },
    passwd: { type: String },
  },
  { timestamps: true }
);

adminSchema.methods.signToken = async function () {
  const payload = {
    user: this.id,
    email: this.email,
  };

  try {
    const token = await jwt.sign(payload, process.env.TOKEN_SECRET);
    return token;
  } catch (err) {
    return err;
  }
};

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
