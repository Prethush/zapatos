const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config({ path: "../config/config.env" });
const userSchema = new Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwd: { type: String, required: true, minlength: 6 },
    image: { type: String },
    active: { type: Boolean, default: false },
    otp: { type: String, default: null },
    isBlocked: { type: Boolean, default: false },
  },

  { timestamps: true }
);

userSchema.methods.signToken = async function () {
  const payload = {
    userId: this.id,
    email: this.email,
    fullName: `${this.firstname} ${this.lastname}`,
    image: this.image,
  };
  try {
    const token = await jwt.sign(payload, process.env.TOKEN_SECRET, {
      expiresIn: "1d",
    });
    return token;
  } catch (err) {
    return err;
  }
};
const User = mongoose.model("User", userSchema);
module.exports = User;
