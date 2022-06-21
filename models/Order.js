const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    shippingInfo: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },
    orderItems: [
      {
        variant: {
          type: Schema.Types.ObjectId,
          ref: "Variant",
          required: true,
        },
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        orderStatus: {
          type: String,
          default: "processing",
        },
      },
    ],
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemsPrice: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    paymentMode: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      required: true,
      default: "processing",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
