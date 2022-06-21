const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const auth = require("../middlewares/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Order = require("../models/Order");
const Variant = require("../models/Variant");

const {
  renderAddSubCategoryForm,
  renderAddMainCategoryForm,
  processAddMainCategoryRequest,
  processAddSubCategoryRequest,
  renderAddProductForm,
  addProduct,
  displayProducts,
  displayProduct,
  editProduct,
  deleteProduct,
  renderEditProduct,
  renderAddVariants,
  renderAddSizeForm,
  processAddVariantRequest,
  deleteVariant,
  renderEditVariantForm,
  processEditVariantRequest,
  renderSizeAddForm,
  processAddSizeRequest,
  renderViewSizePage,
  processSizeEditRequest,
  displayUserOrders,
  allOrders,
  changeOrderStatus,
  displayReports,
} = require("../controllers/productController");

const {
  displayUsers,
  blockUser,
  unblockUser,
  deleteUser,
} = require("../controllers/customerController");
const Product = require("../models/Product");

let dir;
// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    dir = `public/admin/products`;
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

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

router.get("/login", auth.adminIsLoggedIn, (req, res) => {
  res.render("admin_login", {
    error: req.flash("error"),
  });
});

router.post("/login", async (req, res, next) => {
  const { email, passwd } = req.body;
  if (!email || !passwd) {
    req.flash("error", "Enter both fields");
    return res.redirect("/admin/login");
  }
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      req.flash("error", "Email is incorrect");
      return res.redirect("/admin/login");
    }
    if (admin.passwd !== passwd) {
      req.flash("error", "Password is not correct");
      return res.redirect("/admin/login");
    }
    const token = await admin.signToken();
    res.cookie("admin_token", token);
    res.redirect("/admin/home");
  } catch (err) {
    next(err);
  }
});

// router.use(auth.adminAuth);

router.get("/home", auth.adminAuth, async (req, res, next) => {
  let { startDate, endDate } = req.query;
  let d1, d2, text;
  if (!startDate || !endDate) {
    d1 = new Date();
    d1.setDate(d1.getDate() - 7);
    d2 = new Date();
    text = "For the Last 7 days";
  } else {
    d1 = new Date(startDate);
    d2 = new Date(endDate);
    text = `Between ${startDate} and ${endDate}`;
  }

  try {
    // Date wise sales report
    const date = new Date(Date.now());
    const month = date.toLocaleString("default", { month: "long" });
    let salesReport = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $lt: d2,
            $gte: d1,
          },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          total: { $sum: "$totalPrice" },
        },
      },
    ]);

    let dateArray = [];
    let totalArray = [];
    salesReport.forEach((s) => {
      dateArray.push(`${month}-${s._id} `);
      totalArray.push(s.total);
    });

    // total orders
    let totalOrders = await Order.find({ createdAt: { $gte: d1, $lt: d2 } });
    let count = 0;
    totalOrders.forEach((t, i) => {
      t.orderItems.forEach((or, index) => {
        if (or.orderStatus !== "payment failed") {
          count++;
        }
      });
    });

    // get the order count of diffrent stages eg:- processing, cancelled etc
    let orderList = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $lt: d2,
            $gte: d1,
          },
        },
      },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);
    let shippedCount,
      paymentFailedCount,
      cancelledCount,
      processingCount,
      deliveredCount;
    orderList.forEach((or, i) => {
      if (or._id === "shipped") {
        shippedCount = or.count;
      } else if (or._id === "processing") {
        processingCount = or.count;
      } else if (or._id === "payment failed") {
        paymentFailedCount = or.count;
      } else if (or._id === "cancelled") {
        cancelledCount = or.count;
      } else {
        deliveredCount = or.count;
      }
    });

    // sales of products with quantity
    let orders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $lt: d2,
            $gte: d1,
          },
        },
      },
      { $unwind: "$orderItems" },
      {
        $match: {
          $or: [
            { "orderItems.orderStatus": "processing" },
            { "orderItems.orderStatus": "shipped" },
            { "orderItems.orderStatus": "delivered" },
          ],
        },
      },
      {
        $group: {
          _id: "$orderItems.variant",
          salesCount: { $sum: "$orderItems.quantity" },
        },
      },
    ]);

    // all product name with variant id's
    let prodNameArr = await Variant.aggregate([
      {
        $group: { _id: { id: "$_id", name: "$name" } },
      },
    ]);

    let totalSum = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $lt: d2,
            $gte: d1,
          },
        },
      },
      {
        $group: { _id: null, totalPrice: { $sum: "$totalPrice" } },
      },
    ]);

    // pwsa :- product wise sales array
    let pwsa = prodNameArr.map((prod, i) => {
      return { id: prod._id.id, name: prod._id.name, salesCount: 0 };
    });
    orders.forEach((or, i) => {
      pwsa.forEach((p, j) => {
        if (String(p.id) === String(or._id)) {
          console.log(String(p.id), "p", String(or._id));
          p.salesCount = or.salesCount;
        }
      });
    });
    prodNameArr = [];
    let salesCountArr = [];
    pwsa.forEach((p) => {
      prodNameArr.push(p.name);
      salesCountArr.push(p.salesCount);
    });

    let totalPrice = totalSum.length ? totalSum[0].totalPrice : 0;

    // products
    let products = await Product.find({}).distinct("name");
    res.render("admin/index", {
      name: "Admin",
      ordersCount: count,
      text,
      totalRevenue: totalPrice.toLocaleString("en-US"),
      totalSales: totalPrice.toLocaleString("en-US"),
      shippedCount,
      processingCount,
      paymentFailedCount,
      cancelledCount,
      deliveredCount,
      dateArray,
      totalArray,
      startDate: startDate ? startDate : "",
      endDate: endDate ? endDate : "",
      prodNameArr: prodNameArr.length ? prodNameArr : products,
      salesCountArr,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("admin_token");
  res.redirect("/admin/login");
});

// Render main category add form
router.get("/add_main_category", auth.adminAuth, renderAddMainCategoryForm);

// Process add main category request
router.post("/add_main_category", processAddMainCategoryRequest);

//  Render sub category add form
router.get("/add_sub_category", auth.adminAuth, renderAddSubCategoryForm);

//Render product add form
router.get("/addProduct", auth.adminAuth, renderAddProductForm);

// process add sub category request
router.post("/add_sub_category", processAddSubCategoryRequest);
// add a product
router.post("/addProduct", upload.single("image"), addProduct);

// display all products
router.get("/products", auth.adminAuth, displayProducts);

// display a specific product
router.get("/product/:id", auth.adminAuth, displayProduct);

// render product edit form
router.get("/product/edit/:id", renderEditProduct);
// edit product
router.post("/product/edit/:id", upload.single("image"), editProduct);

// delete a product
router.get("/product/delete/:id", deleteProduct);

// display all users
router.get("/users", displayUsers);

// block a user
router.get("/users/block/:id", blockUser);

// unblock a user
router.get("/users/unblock/:id", unblockUser);

// delete a user
router.get("/users/delete/:id", deleteUser);

// render products variants form
router.get("/product/add_variant/:id", renderAddVariants);

// render products size form
router.get("/products/add_size", renderAddSizeForm);

// process add variant request
router.post(
  "/product/add_variant/:id",
  upload.array("images", 4),
  processAddVariantRequest
);

// delete a variant
router.get("/product/variant/delete/:id", deleteVariant);

// render variant edit form
router.get("/product/variant/edit/:id", renderEditVariantForm);

// process edit variant request
router.post(
  "/product/variant/edit/:id",
  upload.array("images", 4),
  processEditVariantRequest
);

// render size add form
router.get("/variant/add_size/:id", renderSizeAddForm);

// render view size page
router.get("/variant/sizes/:id", renderViewSizePage);

// process add size request
router.post("/variant/add_size/:id", processAddSizeRequest);

// render size edit form
// router.get("/variant/size/edit/:id", renderSizeEditForm);

// process size edit request
router.post("/variant/size/edit/:id", processSizeEditRequest);

// view a particular user orders
router.get("/user-order/:id", displayUserOrders);

// view all orders
router.get("/orders", allOrders);

// change order status
router.post("/changeOrderStatus/:id", changeOrderStatus);

// display reports
router.get("/reports", displayReports);
module.exports = router;
