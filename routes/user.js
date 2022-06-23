const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const otpGenerator = require("../utils/otpGenerator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const send_mail = require("../utils/nodeMailer");
const auth = require("../middlewares/auth");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const WishList = require("../models/WishList");
const Variant = require("../models/Variant");
const formValidation = require("../utils/validation");
const Address = require("../models/Address");
const Order = require("../models/Order");
const Size = require("../models/Size");
const Razorpay = require("razorpay");
const pdfkit = require("pdfkit");

dotenv.config({ path: "config/config.env" });

const {
  renderSignUpPage,
  signUpRequest,
  renderEmailVerification,
  processEmailVerification,
  renderLoginPage,
  processLoginRequest,
  passwordChangeEmailVerify,
  processPasswordChange,
} = require("../controllers/userController");

const storage = multer.memoryStorage();

const fileType = (req, file, cb) => {
  if (
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/jpeg" ||
    file.mimetype == "image/png"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({ storage, fileFilter: fileType });

const instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

// Render user signup page

router.get("/signup", auth.verifyToken, renderSignUpPage);

// Process user's signup request

router.post("/signup", upload.single("image"), signUpRequest);

// Render Signup Email verification page
router.get(
  "/signup/emailverification/:id",
  auth.verifyToken,
  renderEmailVerification
);

// Process users's Email verification and update user's active field as true
router.post("/signup/emailVerification/:id", processEmailVerification);

// Render user's Login Page
router.get("/login", auth.verifyToken, renderLoginPage);

// Process user's Login request
router.post("/login", processLoginRequest);

// render password change email verification page
router.get("/confirmEmail", (req, res, next) => {
  res.render("forgot_password", {
    error: req.flash("error"),
    msg: req.flash("msg"),
  });
});

// process email address verified and send a link to change the password
router.post("/confirmEmail", passwordChangeEmailVerify);

// render password change page
router.get("/passwordChange/:id", (req, res) => {
  const { id } = req.params;
  res.render("password_change", {
    id,
    error: req.flash("error"),
    msg: req.flash("msg"),
  });
});

// process password change request
router.post("/passwordChange/:id", processPasswordChange);

// user logout
router.get("/logout", (req, res) => {
  res.clearCookie("user_token");
  res.redirect("/");
});

// user cart
router.get("/cart/:id", auth.verifyToken, async (req, res, next) => {
  if (req.user) {
    let id = req.params.id;
    try {
      let user = await User.findById(id);
      let cart = await Cart.find({ user: req.user.userId }).populate("variant");
      let wishList = await WishList.find({ user: id });
      let sizeArr = [];
      for (let i = 0; i < cart.length; i++) {
        let size = await Size.findOne({
          variant: cart[i].variant,
          size: cart[i].size,
        });
        sizeArr.push(size.stock);
      }
      console.log(cart, "cart");
      let cartCount = cart.length;
      res.render("cart", {
        name: user.firstname,
        image: user.image,
        id,
        cartCount,
        cart,
        wishListCount: wishList.length,
        sizeArr,
      });
    } catch (err) {
      next(err);
    }
  }
});

router.post("/cart/update/:id", auth.verifyToken, async (req, res, next) => {
  if (req.user) {
    const { id } = req.params;
    const { cartId, quantity } = req.body;
    console.log(cartId, quantity);
    try {
      let cart = await Cart.findByIdAndUpdate(
        cartId,
        { quantity },
        { new: true }
      );
      return res.json({ cart });
    } catch (err) {
      next(err);
    }
  }
});

router.post(
  "/cart/increaseQuantity/:id",
  auth.verifyToken,
  async (req, res, next) => {
    if (req.user) {
      const { id } = req.params;
      const { cartId, quantity } = req.body;

      try {
        let cart = await Cart.findById(cartId);
        let size = await Size.findOne({
          variant: cart.variant,
          size: cart.size,
        });
        console.log(quantity, "quantity", size.stock, "stock");
        if (quantity >= size.stock) {
          if (quantity == size.stock) {
            console.log("abc");
            cart = await Cart.findByIdAndUpdate(
              cartId,
              { quantity },
              { new: true }
            );
            return res.json({
              status: "success",
              msg: `Theres is no stock left`,
              cart,
            });
          }
          return res.json({
            status: "error",
            msg: `The product has only 1 stock left`,
          });
        } else {
          cart = await Cart.findByIdAndUpdate(
            cartId,
            { quantity },
            { new: true }
          );
          console.log(cart, "cart");
          return res.json({ status: "success", cart, totalStock: size.stock });
        }
      } catch (err) {
        next(err);
      }
    }
  }
);

router.get("/cart/delete/:id", auth.verifyToken, async (req, res, next) => {
  if (req.user) {
    const { id } = req.params;
    try {
      let cart = await Cart.findByIdAndDelete(id);
      let cartArray = await Cart.find({ user: req.user.userId });
      res.redirect("/users/cart/" + req.user.userId);
    } catch (err) {
      next(err);
    }
  }
});

// render wishlist page
router.get("/wishlist/:id", auth.verifyToken, async (req, res, next) => {
  if (req.user) {
    console.log("abc");
    let { id } = req.params;
    try {
      let user = await User.findById(id);
      let cart = await Cart.find({ user: req.user.userId }).populate("variant");
      let cartCount = cart.length;
      let wishList = await WishList.find({ user }).populate("variant");
      res.render("wishlist", {
        name: user.firstname,
        image: user.image,
        cartCount,
        id: user.id,
        wishList,
        wishListCount: wishList.length,
      });
    } catch (err) {
      console.log("errr");
      next(err);
    }
  }
});

// delete a product from wishlist
router.get(
  "/wishlist/delete/:slug",
  auth.verifyToken,
  async (req, res, next) => {
    if (req.user) {
      let { slug } = req.params;

      try {
        let variant = await Variant.findOne({ slug });
        let wishlist = await WishList.findOneAndDelete({ variant: variant.id });
        let products = await WishList.find({}).populate("variant");
        return res.json({ products });
      } catch (err) {
        next(err);
      }
    }
  }
);

// render user profile page
router.get("/profile/:id", auth.verifyToken, async (req, res, next) => {
  if (req.user) {
    let { id } = req.params;
    try {
      let user = await User.findById(id);
      if (!user) {
        return res.render("page_not_found", {
          admin_token: false,
          user_token: true,
          errors: null,
        });
      }
      let cart = await Cart.find({ user: id }).populate("variant");
      let cartCount = cart.length;
      let wishList = await WishList.find({ user: id }).populate("variant");

      let addressArr = await Address.find({ user: id });
      res.render("user_dashboard", {
        name: user.firstname,
        id,
        image: user.image,
        id,
        wishListCount: wishList.length,
        cartCount,
        user,
        addressArr,
      });
    } catch (err) {
      next(err);
    }
  }
});

// Display the customers all address added
router.get(
  "/profile/viewAddress/:id",
  auth.verifyToken,
  async (req, res, next) => {
    if (req.user) {
      const { id } = req.params;
      try {
        let cart = await Cart.find({ user: req.user.userId }).populate(
          "variant"
        );
        let user = await User.findById(req.user.userId);
        let cartCount = cart.length;
        let wishList = await WishList.find({ user: id }).populate("variant");
        let addressArr = await Address.find({ user: id });
        console.log(addressArr, "array");
        res.render("view_address", {
          name: user.firstname,
          image: user.image,
          id,
          cartCount,
          wishListCount: wishList.length,
          addressArr,
        });
        let;
      } catch (err) {
        next(err);
      }
    }
  }
);
// render user profile edit page
router.get("/profile/edit/:id", auth.verifyToken, async (req, res, next) => {
  const { id } = req.params;
  if (req.user) {
    try {
      let user = await User.findById(id);
      res.render("edit_user_profile", { user, error: req.flash("error") });
    } catch (err) {
      console.log("errr");
      next(err);
    }
  }
});

//process user profile edit request
router.post(
  "/profile/edit/:id",
  auth.verifyToken,
  upload.single("image"),
  async (req, res, next) => {
    const { id } = req.params;
    let { firstname, lastname, email } = req.body;
    try {
      let user = await User.findById(id);
      req.body.image = req.file ? req.file.filename : user.image;
      if (!firstname || !lastname || !email) {
        req.flash("error", "Enter every fields");
        return res.redirect("/users/profile/" + user.id);
      }
      let error = formValidation(
        firstname,
        lastname,
        email,
        "123456",
        "123456"
      );
      console.log(error, "error");
      if (error) {
        req.flash("error", error);
        return res.redirect("/users/profile/edit/" + user.id);
      }
      user = await User.findByIdAndUpdate(id, req.body);
      res.redirect("/users/profile/" + user.id);
    } catch (err) {
      next(err);
    }
  }
);

// delete user's address
router.get(
  "/profile/deleteAddress/:id",
  auth.verifyToken,
  async (req, res, next) => {
    if (req.user) {
      const addrId = req.params.id;
      try {
        let address = await Address.findByIdAndDelete(addrId);
        res.redirect("/users/profile/viewAddress/" + req.user.userId);
      } catch (err) {
        next(err);
      }
    }
  }
);
// render add address page
router.get(
  "/profile/addAddress/:id",
  auth.verifyToken,
  async (req, res, next) => {
    let id = req.user.userId;
    try {
      let user = await User.findById(req.user.userId);
      let cart = await Cart.find({ user: req.user.userId }).populate("variant");
      let cartCount = cart.length;
      let wishList = await WishList.find({ user: id }).populate("variant");
      res.render("add_address", {
        id,
        name: user.firstname,
        image: user.image,
        cartCount,
        wishListCount: wishList.length,
        error: req.flash("error"),
      });
    } catch (err) {
      next(err);
    }
  }
);

// process address add request
router.post(
  "/profile/addAddress/:id",
  auth.verifyToken,
  async (req, res, next) => {
    if (req.user) {
      const { id } = req.params;
      const { address, city, state, pincode, phone } = req.body;
      if (!address || !city || !pincode || !phone || !state) {
        req.flash("error", "Enter all fields");
        return res.redirect("/users/profile/addAddress/" + id);
      }
      try {
        if (pincode.toString().length !== 6) {
          req.flash("error", "Pincode is not valid");
          return res.redirect("/users/profile/addAddress/" + id);
        }
        if (phone.toString().length !== 10) {
          req.flash("error", "Phone number is not valid");
          return res.redirect("/users/profile/addAddress/" + id);
        }
        req.body.user = req.user.userId;
        let address = await Address.create(req.body);
        res.redirect("/users/profile/viewAddress/" + req.user.userId);
      } catch (err) {
        next(err);
      }
    }
  }
);

// edit customer address
router.get(
  "/profile/editAddress/:id",
  auth.verifyToken,
  async (req, res, next) => {
    if (req.user) {
      const { id } = req.params;
      let userId = req.user.userId;
      try {
        let user = await User.findById(req.user.userId);
        let cart = await Cart.find({ user: userId }).populate("variant");
        let cartCount = cart.length;
        let wishList = await WishList.find({ user: userId }).populate(
          "variant"
        );
        let address = await Address.findById(id);
        res.render("edit_address", {
          name: user.firstname,
          image: user.image,
          id: userId,
          cartCount,
          wishListCount: wishList.length,
          address,
          error: req.flash("error"),
        });
      } catch (err) {
        next(err);
      }
    }
  }
);

// process customer edit address request
router.post(
  "/profile/editAddress/:id",
  auth.verifyToken,
  async (req, res, next) => {
    if (req.user) {
      let addrId = req.params.id;
      let userId = req.user.userId;

      let { city, address, state, pincode, phone } = req.body;
      console.log(req.body);
      if (!city || !address || !state || !pincode || !phone) {
        req.flash("error", "Enter all fields");
        return res.redirect("/users/profile/editAddress/" + addrId);
      }
      if (String(pincode).length !== 6) {
        req.flash("error", "Pincode is invalid");
        return res.redirect("/users/profile/editAddress/" + addrId);
      }
      if (String(phone).length !== 10) {
        req.flash("error", "Phone number is invalid");
        return res.redirect("/users/profile/editAddress/" + addrId);
      }
      try {
        req.body.user = userId;
        let newAddr = await Address.findByIdAndUpdate(addrId, req.body, {
          new: true,
        });
        console.log(newAddr, "add");
        res.redirect("/users/profile/viewAddress/" + userId);
      } catch (err) {
        next(err);
      }
    }
  }
);
// render checkout page
router.get("/checkout/:id", auth.verifyToken, async (req, res, next) => {
  let { id } = req.params;
  if (req.user) {
    let userId = req.user.userId;
    let fullName = req.user.fullName;
    let image = req.user.image;
    try {
      let user = await User.findById(id);
      let cart = await Cart.find({ user: req.user.userId }).populate("variant");
      let cartCount = cart.length;
      let wishList = await WishList.find({ user: userId }).populate("variant");
      let address = await Address.find({ user: userId });
      let totalAmount = cart.reduce((acc, curr) => {
        acc += curr.price * curr.quantity;
        return acc;
      }, 0);
      let tax = totalAmount * (18 / 100);
      let grandTotal = totalAmount + tax;
      res.render("checkout", {
        name: fullName,
        email: req.user.email,
        id: userId,
        image,
        cartCount,
        wishListCount: wishList.length,
        address,
        cart,
        totalAmount,
        tax: tax.toFixed(2),
        grandTotal,
        error: req.flash("error"),
      });
    } catch (err) {
      next(err);
    }
  }
});

router.get(
  "/checkout/selectAddress/:id",
  auth.verifyToken,
  async (req, res, next) => {
    const { id } = req.params;
    try {
      let addr = await Address.findById(id);
      if (addr.isDefault) {
        addr = await Address.findByIdAndUpdate(id, { isDefault: false });
        return res.json({ msg: "Deliver to this Address" });
      } else {
        let addArr = await Address.updateMany({}, { isDefault: false });
        addr = await Address.findByIdAndUpdate(id, { isDefault: true });
        return res.json({ msg: "selected" });
      }
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/checkout/newBillingAddress/:id",
  auth.verifyToken,
  async (req, res, next) => {
    if (req.user) {
      let { id } = req.params;
      let { state, city, pincode, address, phone } = req.body;
      console.log(req.body);
      console.log(req.body);
      if (!state || !city || !pincode || !address || !phone) {
        req.flash("error", "Enter all fields");
        return res.redirect("/users/checkout/" + id);
      }
      if (String(pincode).length !== 6) {
        req.flash("error", "Pincode is invaid");
        return res.redirect("/users/checkout/" + id);
      }
      if (String(phone).length !== 10) {
        req.flash("error", "Phone number is invalid");
        return res.redirect("/users/checkout/" + id);
      }
      try {
        req.body.isDefault = true;
        req.body.user = id;
        let address = await Address.create(req.body);
        let addressArr = await Address.find({ user: id });
        addressArr.forEach((a, i) => {
          if (String(a.id) !== String(address.id)) {
            Address.findByIdAndUpdate(
              a.id,
              { isDefault: false },
              (err, data) => {
                if (err) next(err);
                console.log(data);
              }
            );
          }
        });
        res.redirect("/users/checkout/" + id);
      } catch (err) {
        next(err);
      }
    }
  }
);

router.get(
  "/payment-page/request",
  auth.verifyToken,
  async (req, res, next) => {
    if (req.user) {
      try {
        let address = await Address.findOne({
          user: req.user.userId,
          isDefault: true,
        });
        if (address) {
          return res.json({ status: true });
        } else {
          return res.json({ status: false, msg: "Select a delivery address" });
        }
      } catch (err) {
        next(err);
      }
    }
  }
);

router.get("/payment-page", auth.verifyToken, async (req, res, next) => {
  if (req.user) {
    let userId = req.user.userId;
    try {
      let user = await User.findById(req.user.userId);
      let cart = await Cart.find({ user: req.user.userId }).populate("variant");
      let cartCount = cart.length;
      let wishList = await WishList.find({ user: req.user.userId }).populate(
        "variant"
      );
      let address = await Address.findOne({ user: userId, isDefault: true });
      let totalAmount = cart.reduce((acc, curr) => {
        acc += curr.price * curr.quantity;
        return acc;
      }, 0);
      let tax = totalAmount * (18 / 100);
      let grandTotal = totalAmount + tax;
      res.render("payment", {
        name: user.firstname,
        id: userId,
        image: user.image,
        cartCount,
        wishListCount: wishList.length,
        cart,
        totalAmount,
        tax,
        email: user.email,
        grandTotal,
        address,
      });
    } catch (err) {
      next(err);
    }
  }
});

// place order
router.post("/placeOrder", auth.verifyToken, async (req, res, next) => {
  if (req.user) {
    const { paymentMode } = req.body;
    try {
      let address = await Address.findOne({
        user: req.user.userId,
        isDefault: true,
      });
      if (!paymentMode) {
        return res.json({ status: false, msg: "select a payment mode" });
      }
      req.body = {};
      req.body.shippingInfo = {};
      req.body.shippingInfo = {
        address: address.address,
        city: address.city,
        state: address.state,
        phone: address.phone,
        pincode: address.pincode,
      };
      req.body.orderItems = [];
      let userCartArr = await Cart.find({ user: req.user.userId }).populate(
        "variant"
      );
      userCartArr.forEach((c, i) => {
        req.body.orderItems.push({
          variant: c.variant.id,
          product: c.variant.product,
          size: c.size,
          quantity: c.quantity,
        });
      });
      req.body.user = req.user.userId;
      let totalPrice = userCartArr.reduce(
        (acc, curr) => (acc += curr.price * curr.quantity),
        0
      );
      req.body.itemsPrice = totalPrice;
      let tax = totalPrice * (18 / 100);
      req.body.tax = tax;
      let grandTotal = tax + totalPrice;
      req.body.totalPrice = grandTotal;
      req.body.paymentMode = paymentMode;
      // req.body.paymentStatus = "pending";
      // let date = new Date(Date.now());
      // date.setDate(date.getDate() + 7);
      // req.body.deliveryDate = date.toDateString();
      let order = await Order.create(req.body);
      grandTotal = Number(grandTotal * 100);
      if (paymentMode === "razorpay") {
        const options = {
          amount: Math.floor(grandTotal),
          currency: "INR",
          receipt: order.id,
        };
        instance.orders.create(options, function (err, order) {
          if (err) return next(err);
          return res.json({
            status: true,
            order,
            grandTotal,
            mode: "razorpay",
          });
        });
      } else {
        userCartArr.forEach((c, i) => {
          Size.findOneAndUpdate(
            { variant: c.variant, size: c.size },
            { $inc: { stock: -c.quantity } },
            { new: true },
            (err, data) => {
              if (err) return next(err);
            }
          );
        });
        let cart = await Cart.deleteMany({ user: req.user.userId });
        return res.json({
          status: true,
          mode: "cod",
          order,
        });
      }
    } catch (err) {
      next(err);
    }
  }
});

// verify payment
router.post(
  "/checkout/verifyPayment",
  auth.verifyToken,
  async (req, res, next) => {
    if (req.user) {
      const { payment, order } = req.body;
      const crypto = require("crypto");
      try {
        let hmac = crypto.createHmac("sha256", "c9m2AmSxXMg9mvluhbnSQd1q");
        hmac.update(
          payment["razorpay_order_id"] + "|" + payment["razorpay_payment_id"]
        );
        hmac = hmac.digest("hex");
        if (hmac == payment["razorpay_signature"]) {
          let userCartArr = await Cart.find({ user: req.user.userId });
          userCartArr.forEach((c, i) => {
            Size.findOneAndUpdate(
              { variant: c.variant, size: c.size },
              { $inc: { stock: -c.quantity } },
              { new: true },
              (err, data) => {
                if (err) return next(err);
              }
            );
          });
          let updatedOrder = await Order.findByIdAndUpdate(order.receipt, {
            paymentStatus: "paid",
          });
          let cart = await Cart.deleteMany({ user: req.user.userId });
          return res.json({ status: true, orderId: order.receipt });
        }
      } catch (err) {
        next(err);
      }
    }
  }
);

router.get("/payment-failure/:id", auth.verifyToken, async (req, res, next) => {
  if (req.user) {
    let orderId = req.params.id;
    try {
      let order = await Order.updateMany(
        { _id: orderId },
        {
          $set: {
            "orderItems.$[].orderStatus": "payment failed",
            paymentStatus: "payment failed",
          },
        }
      );
    } catch (err) {
      next(err);
    }
  }
});

router.get("/payment-success/:id", auth.verifyToken, async (req, res, next) => {
  if (req.user) {
    let userId = req.user.userId;
    let orderId = req.params.id;

    try {
      let user = await User.findById(req.user.userId);
      let cart = await Cart.find({ user: req.user.userId }).populate("variant");
      let cartCount = cart.length;
      let wishList = await WishList.find({ user: userId }).populate("variant");
      let address = await Address.find({ user: userId });
      let order = await Order.findById(orderId);
      res.render("success", {
        name: user.firstname,
        id: req.user.userId,
        image: user.image,
        cartCount,
        wishListCount: wishList.length,
        order,
      });
    } catch (err) {
      next(err);
    }
  }
});

// A particular user's order list
router.get("/orders/:id", auth.verifyToken, async (req, res, next) => {
  let { id } = req.params;
  console.log(id, "id");
  if (req.user) {
    let userId = req.user.userId;

    try {
      let user = await User.findById(id);
      if (!user) {
        return res.render("page_not_found", {
          admin_token: false,
          user_token: true,
          errors: null,
        });
        s;
      }
      let cart = await Cart.find({ user: req.user.userId }).populate("variant");
      let cartCount = cart.length;
      let wishList = await WishList.find({ user: userId }).populate("variant");
      let orders = await Order.find({ user: req.user.userId })
        .populate([
          { path: "orderItems.variant" },
          { path: "orderItems.product" },
        ])
        .sort({ createdAt: -1 });
      res.render("user_orders", {
        name: user.firstname,
        id: req.user.userId,
        image: user.image,
        cartCount,
        orders,
        wishListCount: wishList.length,
      });
    } catch (err) {
      next(err);
    }
  }
});

router.get("/order-details/:id", auth.verifyToken, async (req, res, next) => {
  console.log("abc");
  if (req.user) {
    let { id } = req.params;
    let objectId = id;
    let { orderId, prodId } = req.query;
    console.log(req.query);
    console.log();
    try {
      let user = await User.findById(req.user.userId);
      let cart = await Cart.find({ user: req.user.userId }).populate("variant");
      let cartCount = cart.length;
      let wishList = await WishList.find({ user: req.user.userId }).populate(
        "variant"
      );
      let order = await Order.findById({ _id: orderId }).populate([
        { path: "orderItems.variant" },
        { path: "orderItems.product" },
      ]);
      console.log(order.orderItems[0].variant, "order");
      let orderDetail = {};
      order.orderItems.forEach((od, i) => {
        if (String(objectId) === String(od.id)) {
          orderDetail.name = od.variant.name;
          orderDetail.price = od.product.price;
          orderDetail.quantity = od.quantity;
          orderDetail.size = od.size;
          orderDetail.paymentMode = order.paymentMode;
          orderDetail.image = od.variant.images[0].img;
          orderDetail.purchaseDate = order.createdAt.toDateString();
          orderDetail.shippingAddress = order.shippingInfo;
          orderDetail.orderStatus = od.orderStatus;
        }
      });
      console.log(orderDetail, "orderdetail");
      res.render("order_details", {
        name: user.firstname,
        id: req.user.userId,
        image: user.image,
        cartCount,
        orderDetail,
        wishListCount: wishList.length,
      });
    } catch (err) {
      next(err);
    }
  }
});

// cancel order
router.get("/orders/cancel/:id", auth.verifyToken, async (req, res, next) => {
  if (req.user) {
    let { size, variantId, objectId, quantity } = req.query;
    let orderId = req.params.id;
    try {
      let order = await Order.findById(orderId);
      order = await Order.findOneAndUpdate(
        { _id: orderId, "orderItems._id": objectId },
        { $set: { "orderItems.$.orderStatus": "cancelled" } },
        { new: true }
      ).populate([{ path: "orderItems.product" }]);
      let total = 0,
        tax = 0,
        grandTotal = 0;
      order.orderItems.forEach((or, i) => {
        if (String(or.variant) === String(variantId)) {
          total += or.product.price * or.quantity;
          tax += (or.product.price * or.quantity * 18) / 100;
        }
      });

      grandTotal = total + tax;
      console.log(total, "total", tax, "tax", grandTotal, "grand");
      order = await Order.findByIdAndUpdate(
        orderId,
        {
          $inc: { itemsPrice: -total, tax: -tax, totalPrice: -grandTotal },
        },
        { new: true }
      );

      let stock = await Size.findOneAndUpdate(
        { variant: variantId, size },
        { $inc: { stock: Number(quantity) } },
        { new: true }
      );
      res.redirect("/users/orders/" + req.user.userId);
    } catch (err) {
      next(err);
    }
  }
});

// create invoice
// router.get("/create-invoice/:id", auth.verifyToken, async (req, res, next) => {
//   if (req.user) {
//     console.log(req.params.id);
//     try {
//       let order = await Order.findById(req.params.id).populate([
//         {
//           path: "user",
//         },
//         {
//           path: "orderItems.variant",
//         },
//         {
//           path: "orderItems.product",
//         },
//       ]);
//       let products = [];
//       order.orderItems.forEach((item, index) => {
//         products.push({
//           quantity: item.quantity,
//           description: item.variant.name,
//         });
//       });
//       const pdfDocument = new pdfkit();
//     } catch (err) {
//       next(err);
//     }
//   }
// });
module.exports = router;
