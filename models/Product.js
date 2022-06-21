const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    ratings: { type: Number, default: 0 },
    mainCategory: {
      type: Schema.Types.ObjectId,
      ref: "MainCategory",
      required: true,
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    image: [
      {
        type: Object,
        required: true,
      },
    ],
    variants: [
      {
        type: Schema.Types.ObjectId,
        ref: "Variant",
      },
    ],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
