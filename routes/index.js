const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Product = require("../models/Product");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Variant = require("../models/Variant");
const Size = require("../models/Size");
const Cart = require("../models/Cart");
const SubCategory = require("../models/SubCategory");
const MainCategory = require("../models/MainCategory");
const WishList = require("../models/WishList");

router.get(
  "/",
  auth.adminRedirect,
  auth.authOptional,
  async (req, res, next) => {
    let fullName = null;
    let image = null;
    let id = req.user ? req.user.userId : null;
    let user = null;
    let cartCount = 0,
      wishListCount = 0;
    let { admin_token } = req.cookies;
    if (admin_token) {
      return res.redirect("/admin/home");
    }
    try {
      const products = await Product.find({})
        .populate("variants")
        .sort({ createdAt: -1 })
        .limit(29);
      const products6 = products.slice(0, 6);
      let products5 = [];
      products6.forEach((p, i) => {
        if (p && p.variants[0]) {
          products5.push(p);
        }
      });
      console.log(products5.length, "prod");
      const products2 = products.slice(6, 9);
      const products3 = products.slice(9, 17);
      const products4 = products.slice(17, 29);

      if (id) {
        user = await User.findById(req.user.userId);
        fullName = user.firstname;
        image = user.image;
        cartCount = await Cart.find({ user: req.user.userId }).count();
        wishListCount = await WishList.find({ user: req.user.userId });
      }

      res.render("home_page", {
        products5,
        products2,
        products3,
        products4,
        name: fullName,
        image,
        cartCount,
        id,
        wishListCount: wishListCount.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/product/:slug",
  auth.adminRedirect,
  auth.authOptional,
  async (req, res, next) => {
    let fullName = undefined;
    let image = undefined;
    let user = undefined;
    let id = req.user ? req.user.userId : undefined;
    const { slug } = req.params;
    let cartCount = 0,
      wishListCount = 0,
      cart,
      index = -1;
    try {
      let variant = await Variant.findOne({ slug }).populate("size");

      let wishList = await WishList.findOne({ variant: variant.id, user: id });
      let product = await Product.findById(variant.product).populate(
        "variants"
      );
      let relatedProducts = await Product.find({
        mainCategory: product.mainCategory,
      })
        .populate("variants")
        .sort({ createdAt: -1 })
        .limit(8);
      console.log(relatedProducts, "related");
      if (id) {
        user = await User.findById(req.user.userId);
        fullName = user.firstname;
        image = user.image;
        cartCount = await Cart.find({ user: req.user.userId }).count();
        wishListCount = await WishList.find({ user: req.user.userId });
        cart = await Cart.find({ user: id });
        index = cart.findIndex((c) => c.variant.equals(variant.id));
      }
      console.log(product, "product");
      res.render("product_details", {
        variant,
        product,
        name: fullName,
        image,
        error: req.flash("error"),
        msg: req.flash("msg"),
        cartCount,
        id,
        wishList,
        wishListCount: wishListCount.length,
        isVisible: index === -1 ? true : false,
        relatedProducts,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/product/addCart/:slug",
  auth.verifyToken,
  async (req, res, next) => {
    if (!req.user) {
      return res.json({
        status: "not loggedin",
      });
    }
    const { slug } = req.params;

    const { size, quantity } = req.body;
    if (size == "Choose an option") {
      return res.json({
        status: "error",
        msg: "Please select the size",
        quantity: "same",
      });
    }
    let variant = await Variant.findOne({ slug });
    let product = await Product.findById(variant.product);
    let sizeDoc = await Size.findOne({ size, variant: variant.id });
    let cart = await Cart.find({ user: req.user.userId });
    let result = cart.findIndex((c) => {
      return (
        c.user.equals(req.user.userId) &&
        c.variant.equals(variant.id) &&
        c.size === Number(size)
      );
    });
    if (quantity <= sizeDoc.stock) {
      if (result === -1) {
        let obj = {
          user: req.user.userId,
          variant: variant.id,
          size,
          quantity,
          price: product.price,
        };
        let cart = await Cart.create(obj);
        return res.json({
          status: "success",
          msg: "Your product is successfully saved to cart",
          quantity: "increased",
        });
      }
    } else {
      return res.json({
        status: "error",
        msg: `The product that you have selected is ${sizeDoc.stock} stocks left`,
      });
    }
  }
);

router.get(
  "/products/men",
  auth.adminRedirect,
  auth.verifyToken,
  async (req, res, next) => {
    let { page_num } = req.query;
    page_num = !page_num ? 0 : page_num;
    let fullName = undefined;
    let image = undefined;
    let id = req.user ? req.user.userId : undefined;
    let user = undefined;
    let cartCount = 0,
      wishListCount = 0;

    try {
      if (id) {
        user = await User.findById(req.user.userId);
        fullName = user.firstname;
        image = user.image;
        cartCount = await Cart.find({ user: req.user.userId }).count();
        wishListCount = await WishList.find({ user: req.user.userId });
      }
      let men = await SubCategory.findOne({ name: "men" });
      let productCount = 0;
      let products = [];
      if (men) {
        productCount = await Product.find({ subCategory: men.id }).count();
        products = await Product.find({ subCategory: men.id })
          .populate("variants")
          .skip(page_num * 9)
          .limit(9);
      }
      res.render("men", {
        name: fullName,
        image,
        id,
        page_num,
        cartCount,
        pageCount: Math.ceil(productCount / 9),
        products,
        wishListCount: wishListCount.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/products/women",
  auth.adminRedirect,
  auth.verifyToken,
  async (req, res, next) => {
    let { page_num } = req.query;
    page_num = !page_num ? 0 : page_num;
    let fullName = undefined;
    let image = undefined;
    let id = req.user ? req.user.userId : undefined;
    let user = undefined;
    let cartCount = 0,
      wishListCount = 0;

    try {
      if (id) {
        user = await User.findById(req.user.userId);
        fullName = user.firstname;
        image = user.image;
        cartCount = await Cart.find({ user: req.user.userId }).count();
        wishListCount = await WishList.find({ user: req.user.userId });
      }
      let women = await SubCategory.findOne({ name: "women" });
      let productCount = 0;
      let products = [];
      if (women) {
        productCount = await Product.find({ subCategory: women.id }).count();
        products = await Product.find({ subCategory: women.id })
          .populate("variants")
          .skip(page_num * 9)
          .limit(9);
      }
      res.render("women", {
        name: fullName,
        image,
        id,
        page_num,
        cartCount,
        pageCount: Math.ceil(productCount / 9),
        products,
        wishListCount: wishListCount.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/products/men/priceSortAdvanced", async (req, res, next) => {
  let { basic, advanced, category, search } = req.query;
  let obj, products, priceOne, priceTwo, selectedCategory, allCategory;

  if (basic === "null") {
    obj = { createdAt: -1 };
  } else if (basic === "ascending") {
    obj = { price: 1 };
  } else {
    obj = { price: -1 };
  }
  if (advanced !== "null") {
    let priceArr = advanced.split("-");
    priceOne = Number(priceArr[0]);
    priceTwo = Number(priceArr[1]);
  }

  try {
    if (category === "all") {
      allCategory = await MainCategory.find({}).distinct("_id");
    } else {
      selectedCategory = await MainCategory.findOne({ name: category });
    }

    let men = await SubCategory.findOne({ name: "men" });
    if (search !== "") {
      let allProducts = await Product.find({ subCategory: men.id });
      products = allProducts.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
      return res.json({ products });
    }
    console.log(
      selectedCategory,
      "selected",
      allCategory,
      "all",
      basic,
      "basic",
      advanced,
      "advanced"
    );
    if (advanced === "null") {
      products = await Product.find({
        subCategory: men.id,
        mainCategory:
          category === "all" ? { $in: allCategory } : selectedCategory,
      })
        .populate("variants")
        .sort(obj);
    } else {
      products = await Product.find({
        subCategory: men.id,
        mainCategory:
          category === "all" ? { $in: allCategory } : selectedCategory,
        price: { $gte: priceOne, $lte: priceTwo },
      })
        .populate("variants")
        .sort(obj);
    }
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

router.get("/products/women/priceSortAdvanced", async (req, res, next) => {
  let { basic, advanced, category, search } = req.query;
  let obj, products, priceOne, priceTwo, selectedCategory, allCategory;
  console.log;
  if (basic === "null") {
    obj = { createdAt: -1 };
  } else if (basic === "ascending") {
    obj = { price: 1 };
  } else {
    obj = { price: -1 };
  }
  if (advanced !== "null") {
    let priceArr = advanced.split("-");
    priceOne = Number(priceArr[0]);
    priceTwo = Number(priceArr[1]);
  }

  try {
    if (category === "all") {
      allCategory = await MainCategory.find({}).distinct("_id");
    } else {
      selectedCategory = await MainCategory.findOne({ name: category });
    }

    let women = await SubCategory.findOne({ name: "women" });
    if (search !== "") {
      let allProducts = await Product.find({ subCategory: women.id });
      products = allProducts.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
      console.log(products, "products");
      return res.json({ products });
    }
    if (advanced === "null") {
      products = await Product.find({
        subCategory: women.id,
        mainCategory:
          category === "all" ? { $in: allCategory } : selectedCategory,
      })
        .populate("variants")
        .sort(obj);
    } else {
      console.log(priceOne, priceTwo);
      products = await Product.find({
        subCategory: women.id,
        mainCategory:
          category === "all" ? { $in: allCategory } : selectedCategory,
        price: { $gte: priceOne, $lte: priceTwo },
      })
        .populate("variants")
        .sort(obj);
    }
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

router.get("/products/kids", auth.verifyToken, async (req, res, next) => {
  console.log("kids");
  let { page_num } = req.query;
  page_num = !page_num ? 0 : page_num;
  let fullName = undefined;
  let image = undefined;
  let id = req.user ? req.user.userId : undefined;
  let user = undefined;
  let cartCount = 0,
    wishListCount = 0;

  try {
    if (id) {
      user = await User.findById(req.user.userId);
      fullName = user.firstname;
      image = user.image;
      cartCount = await Cart.find({ user: req.user.userId }).count();
      wishListCount = await WishList.find({ user: req.user.userId });
    }
    let kid = await SubCategory.findOne({ name: "kids" });
    let productCount = 0;
    let products = [];
    if (kid) {
      productCount = await Product.find({ subCategory: kid.id }).count();
      products = await Product.find({ subCategory: kid.id })
        .populate("variants")
        .skip(page_num * 9)
        .limit(9);
    }
    res.render("kids", {
      name: fullName,
      image,
      id,
      page_num,
      cartCount,
      pageCount: Math.ceil(productCount / 9),
      products,
      wishListCount: wishListCount.length,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/products/kids/priceSortAdvanced", async (req, res, next) => {
  let { basic, advanced, category, search } = req.query;
  let obj, products, priceOne, priceTwo, selectedCategory, allCategory;

  if (basic === "null") {
    obj = { createdAt: -1 };
  } else if (basic === "ascending") {
    obj = { price: 1 };
  } else {
    obj = { price: -1 };
  }
  if (advanced !== "null") {
    let priceArr = advanced.split("-");
    priceOne = Number(priceArr[0]);
    priceTwo = Number(priceArr[1]);
  }

  try {
    if (category === "all") {
      allCategory = await MainCategory.find({}).distinct("_id");
    } else {
      selectedCategory = await MainCategory.findOne({ name: category });
    }

    let kid = await SubCategory.findOne({ name: "kids" });
    if (search !== "") {
      let allProducts = await Product.find({ subCategory: kid.id });
      products = allProducts.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
      return res.json({ products });
    }
    console.log(
      selectedCategory,
      "selected",
      allCategory,
      "all",
      basic,
      "basic",
      advanced,
      "advanced"
    );
    if (advanced === "null") {
      products = await Product.find({
        subCategory: kid.id,
        mainCategory:
          category === "all" ? { $in: allCategory } : selectedCategory,
      })
        .populate("variants")
        .sort(obj);
    } else {
      products = await Product.find({
        subCategory: kid.id,
        mainCategory:
          category === "all" ? { $in: allCategory } : selectedCategory,
        price: { $gte: priceOne, $lte: priceTwo },
      })
        .populate("variants")
        .sort(obj);
    }
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/product/addToWishList/:slug",
  auth.verifyToken,
  async (req, res, next) => {
    let { slug } = req.params;
    if (!req.user) {
      return res.json({ status: "error", msg: "not loggedin" });
    }
    try {
      let variant = await Variant.findOne({ slug });
      let wishList = await WishList.findOne({
        variant: variant.id,
        user: req.user.userId,
      });
      if (wishList) {
        wishList = await WishList.findByIdAndDelete(wishList.id);
        return res.json({
          status: "success",
          msg: `removed from wishlist`,
          msg2: `${variant.name} is removed from wishlist`,
        });
      } else {
        wishList = await WishList.create({
          variant: variant.id,
          user: req.user.userId,
        });
        return res.json({
          status: "success",
          msg: `added to wishlist`,
          msg2: `${variant.name} is added to wishlist`,
        });
      }
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
