const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sizeSchema = new Schema(
  {
    variant: {
      type: Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },
    size: { type: Number, required: true },
    stock: { type: Number, required: true },
  },

  { timestamps: true }
);

const Size = mongoose.model("Size", sizeSchema);
module.exports = Size;
