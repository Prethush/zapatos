const Product = require("../models/Product");
const User = require("../models/User");
const MainCategory = require("../models/MainCategory");
const SubCategory = require("../models/SubCategory");
const Variant = require("../models/Variant");
const Size = require("../models/Size");
const Order = require("../models/Order");

const renderAddMainCategoryForm = async (req, res, next) => {
  try {
    const category = await MainCategory.find({}).distinct("mainCategory");
    res.locals.error = undefined;
    res.render("admin/add_main_category", {
      category,
      error: req.flash("error"),
    });
  } catch (err) {
    next(err);
  }
};

const processAddMainCategoryRequest = async (req, res, next) => {
  let { name } = req.body;
  console.log(name);
  try {
    if (name) {
      name = name.toLowerCase().trim();
      let data = await MainCategory.findOne({ name });
      if (!data) {
        data = await MainCategory.create(req.body);
        return res.redirect("/admin/products");
      } else {
        return res.redirect("/admin/products");
      }
    } else {
      req.flash("error", "Enter all fields");
      res.redirect("/admin/add_main_category");
    }
  } catch (err) {
    next(err);
  }
};

// process render add subcategory form
const renderAddSubCategoryForm = async (req, res, next) => {
  try {
    const categories = await MainCategory.find({}).distinct("name");
    res.render("admin/add_sub_category", {
      categories,
      error: req.flash("error"),
    });
  } catch (err) {
    next(err);
  }
};

// process render add product form
const renderAddProductForm = async (req, res, next) => {
  try {
    const main = await MainCategory.find({}).distinct("name");
    const sub = await SubCategory.find({}).distinct("name");
    res.render("admin/add_product", { error: req.flash("error"), main, sub });
  } catch (err) {
    next(err);
  }
};

// process adding subcategory request
const processAddSubCategoryRequest = async (req, res, next) => {
  let { name, mainCategory } = req.body;
  try {
    if (name !== "null" && mainCategory !== "null") {
      name = name.toLowerCase().trim();
      mainCategory = mainCategory.toLowerCase().trim();
      let category = await MainCategory.findOne({ name: mainCategory });
      let doc = await SubCategory.findOne({ name, mainCategory: category.id });
      if (!doc) {
        doc = await SubCategory.create({ name, mainCategory: category.id });
        res.redirect("/admin/products");
      } else {
        res.redirect("/admin/products");
      }
    } else {
      req.flash("error", "Enter all fields");
      res.redirect("/admin/add_sub_category");
    }
  } catch (err) {
    next(err);
  }
};

// process add product request
const addProduct = async (req, res, next) => {
  let { name, description, price, mainCategory, subCategory, discount } =
    req.body;

  if (
    name &&
    description &&
    price &&
    mainCategory !== "null" &&
    subCategory !== "null" &&
    discount &&
    req.file
  ) {
    req.body.image = [];
    req.body.image.push({ img: req.file.filename });
    req.body.name = name.trim();
    try {
      mainCategory = await MainCategory.findOne({
        name: mainCategory.toLowerCase().trim(),
      });
      subCategory = await SubCategory.findOne({
        name: subCategory.toLowerCase().trim(),
      });
      req.body.mainCategory = mainCategory._id;
      req.body.subCategory = subCategory._id;
      let products = await Product.findOne({
        name: req.body.name,
        subCategory: req.body.subCategory,
      });
      console.log(products, "products");
      if (products) {
        req.flash(
          "error",
          "Same product is already added if you want to add variants go to variants section"
        );
        return res.redirect("/admin/addProduct");
      } else {
        products = await Product.create(req.body);
        return res.redirect("/admin/products");
      }
    } catch (err) {
      next(err);
    }
  } else {
    req.flash("error", "Enter all fields");
    res.redirect("/admin/addProduct");
  }
};

const displayProducts = async (req, res, next) => {
  try {
    const products = await Product.find({});
    res.render("admin/products", { products });
  } catch (err) {
    next(err);
  }
};

const displayProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    const variants = await Variant.find({ product: id });
    res.render("admin/product_details", { product, variants });
  } catch (err) {
    next(err);
  }
};

const renderEditProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    const mainName = await MainCategory.findById(product.mainCategory);
    const subName = await SubCategory.findById(product.subCategory);
    const main = await MainCategory.find({}).distinct("name");
    const sub = await SubCategory.find({}).distinct("name");
    res.render("admin/product_edit", {
      product,
      main,
      sub,
      mainName: mainName.name,
      subName: subName.name,
    });
  } catch (err) {
    next(err);
  }
};

const editProduct = async (req, res, next) => {
  let { name, description, price, mainCategory, subCategory, discount } =
    req.body;

  const { id } = req.params;
  if (name && description && price && mainCategory && subCategory && discount) {
    try {
      let product = await Product.findById(id);
      req.body.image = [];

      console.log(product.image);
      if (req.file) {
        req.body.image.push({ img: req.file.filename });
      } else {
        req.body.image = product.image;
      }

      if (
        name &&
        description &&
        price &&
        mainCategory &&
        subCategory &&
        discount
      ) {
        mainCategory = await MainCategory.findOne({ name: mainCategory });
        subCategory = await SubCategory.findOne({ name: subCategory });
        req.body.mainCategory = mainCategory._id;
        req.body.subCategory = subCategory._id;
        product = await Product.findByIdAndUpdate(id, req.body);
        res.redirect("/admin/product/" + product.id);
      }
    } catch (err) {
      next(err);
    }
  }
};

const renderAddVariants = async (req, res, next) => {
  const { id } = req.params;
  try {
    const products = await Product.find({}).distinct("name");

    res.render("admin/add_variants", { products, id });
  } catch (err) {
    next(err);
  }
};

const processAddVariantRequest = async (req, res, next) => {
  const { id } = req.params;
  let { product, color, images } = req.body;
  req.body.images = [];
  if (product !== "null" && color && req.files.length) {
    try {
      req.files.forEach((f) => {
        req.body.images.push({ img: f.filename });
      });
      req.body.color = [];
      color.split("/").forEach((c) => {
        req.body.color.push(c.toLowerCase().trim());
      });
      req.body.product = id;
      let product = await Product.findById(id);
      req.body.name = product.name;
      const variant = await Variant.create(req.body);
      product = await Product.findByIdAndUpdate(id, {
        $push: { variants: variant.id },
      });
      res.redirect("/admin/product/" + id);
    } catch (err) {
      next(err);
    }
  }
};

const deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    console.log("abc");
    const product = await Product.findOneAndDelete({ _id: id });
    let allVariants = await Variant.find({ product: id });
    let variants = await Variant.deleteMany({ product: id });
    console.log(allVariants, "variants");
    allVariants.forEach((v) => {
      Size.deleteMany({ variant: v.id }, (err, data) => {
        if (err) return next(err);
        console.log(data);
      });
    });
    res.redirect("/admin/products");
  } catch (err) {
    next(err);
  }
};

const renderAddSizeForm = async (req, res, next) => {
  try {
    const products = await Product.find({}).distinct("name");
    res.render("admin/add_size", { products });
  } catch (err) {}
};

const deleteVariant = async (req, res, next) => {
  const { id } = req.params;
  try {
    const variant = await Variant.findByIdAndDelete(id);
    let product = await Product.findByIdAndUpdate(variant.product, {
      $pull: { variants: variant.id },
    });
    let sizes = await Size.deleteMany({ variant: id });
    res.redirect("/admin/product/" + variant.product);
  } catch (err) {
    next(err);
  }
};

const renderEditVariantForm = async (req, res, next) => {
  const { id } = req.params;
  try {
    const variant = await Variant.findById(id);
    const products = await Product.find({}).distinct("name");
    res.render("admin/variant_edit", { variant, products });
  } catch (err) {
    next(err);
  }
};

const processEditVariantRequest = async (req, res, next) => {
  console.log(req.files);
  const { id } = req.params;
  const { product, color } = req.body;
  if (product && color) {
    try {
      let variant = await Variant.findById(id);
      req.body.images = [];
      if (req.files.length) {
        req.files.forEach((f) => {
          req.body.images.push({ img: f.filename });
        });
      } else {
        req.body.images = variant.images;
      }
      for (let i = 0; i < 4; i++) {
        if (!req.body.images[i]) {
          req.body.images.push(variant.images[i]);
        }
      }
      req.body.color = [];
      color.split("/").forEach((f) => {
        req.body.color.push(f.toLowerCase().trim());
      });
      let doc = await Product.findOne({ name: product });
      req.body.product = doc._id;
      variant = await Variant.findByIdAndUpdate(id, req.body);
      res.redirect("/admin/product/" + variant.product);
    } catch (err) {
      next(err);
    }
  }
};

const renderSizeAddForm = async (req, res, next) => {
  const { id } = req.params;
  console.log(id);
  try {
    const variant = await Variant.findById(id);
    res.render("admin/add_size", { variant });
  } catch (err) {
    next(err);
  }
};

const processAddSizeRequest = async (req, res, next) => {
  const { id } = req.params;
  let { size, stock } = req.body;
  if (size && stock) {
    try {
      let variant = await Variant.findById(id);
      let sizeDoc = await Size.findOne({ size, variant: id });
      if (sizeDoc) {
        let newStock = sizeDoc.stock + Number(stock);
        sizeDoc = await Size.findByIdAndUpdate(sizeDoc._id, {
          stock: newStock,
        });
        return res.redirect("/admin/product/" + variant.product);
      }
      req.body.variant = variant._id;
      sizeDoc = await Size.create(req.body);
      variant = await Variant.findByIdAndUpdate(variant.id, {
        $push: { size: sizeDoc.id },
      });
      res.redirect("/admin/product/" + variant.product);
    } catch (err) {
      next(err);
    }
  }
};

const renderViewSizePage = async (req, res, next) => {
  const { id } = req.params;
  console.log(id);
  try {
    const sizes = await Size.find({ variant: id });
    console.log(sizes);
    res.render("admin/view_sizes", { sizes });
  } catch (err) {
    next(err);
  }
};
// const renderSizeEditForm = async (req, res, next) => {
//   const { id } = req.params;
//   try {
//     let s = await Size.findById(id);
//     res.render("admin/edit_size", { s });
//   } catch (err) {
//     next(err);
//   }
// };

let processSizeEditRequest = async (req, res, next) => {
  const { id } = req.params;
  const { size, stock } = req.body;
  if (stock && size) {
    try {
      let s = await Size.findById(id);
      let doc = await Size.findOne({ size });
      if (doc) {
        let newStock = doc.stock + Number(stock);
        doc = await Size.findByIdAndUpdate(doc._id, { stock: newStock });
        return res.redirect("/admin/variant/sizes/" + id);
      } else {
        s = await findByIdAndUpdate(s.id, req.body);
        res.redirect("/admin/variant/sizes" + id);
      }
    } catch (err) {
      next(err);
    }
  }
};

// display a user's order list
let displayUserOrders = async (req, res, next) => {
  const userId = req.params.id;
  try {
    let user = await User.findById(userId);
    let orders = await Order.find({ user: userId }).populate([
      { path: "orderItems.variant" },
      { path: "orderItems.product" },
    ]);
    let data = [];
    orders.forEach((or, index) => {
      or.orderItems.forEach((item, i) => {
        data.push({
          prodName: item.variant.name,
          image: item.variant.images[0].img,
          price: item.product.price,
          quantity: item.quantity,
          size: item.size,
          purchasedDate: or.createdAt.toDateString(),
          paymentMethod: or.paymentMode,
          paidStaus: or.paymentStatus,
        });
      });
    });

    console.log(data, "data");
    res.render("admin/user_orders", {
      user,
      data,
    });
  } catch (err) {
    next(err);
  }
};

// Display all orders
let allOrders = async (req, res, next) => {
  try {
    let orders = await Order.find({})
      .populate([
        { path: "orderItems.variant" },
        {
          path: "orderItems.product",
        },
        {
          path: "user",
        },
      ])
      .sort({ createdAt: -1 });
    let data = [];
    console.log(orders);
    orders.forEach((or, index) => {
      or.orderItems.forEach((item, i) => {
        data.push({
          user: or.user.firstname + " " + or.user.lastname,
          prodName: item.variant.name,
          image: item.variant.images[0].img,
          price: item.product.price,
          totalPrice: or.totalPrice,
          quantity: item.quantity,
          size: item.size,
          purchasedDate: or.createdAt.toDateString(),
          paymentMethod: or.paymentMode,
          paidStaus: or.paymentStatus,
          orderStatus: item.orderStatus,
          orderId: or.id,
          objectId: item.id,
        });
      });
    });
    res.render("admin/all_orders", {
      data,
    });
  } catch (err) {
    next(err);
  }
};

// change orderstatus
let changeOrderStatus = async (req, res, next) => {
  let orderId = req.params.id;
  let { objectId, status } = req.body;
  console.log(objectId, "objid");
  try {
    let order = await Order.findById(orderId);
    if (order.orderStatus === status) {
      return res.json({ status: true });
    }
    order = await Order.findOneAndUpdate(
      { _id: orderId, "orderItems._id": objectId },
      { $set: { "orderItems.$.orderStatus": status } },
      { new: true }
    );
    if (status === "delivered" && order.paymentMode === "cod") {
      console.log("aaaa");
      order = await Order.findByIdAndUpdate(
        orderId,
        { paymentStatus: "paid" },
        { new: true }
      );
    }
    console.log(order, "order");
    res.json({ status: true });
  } catch (err) {
    next(err);
  }
};

let displayReports = async (req, res, next) => {
  let { startDate, endDate } = req.query;
  let d1, d2;
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
    console.log(salesReport, "sales ");

    let dateArray = [];
    let totalArray = [];
    salesReport.forEach((s) => {
      dateArray.push(`${month}-${s._id} `);
      totalArray.push(s.total);
    });
    console.log(totalArray, dateArray);
    res.render("admin/reports", {
      totalArray,
      dateArray,
      startDate: startDate ? startDate : "",
      endDate: endDate ? endDate : "",
    });
  } catch (err) {
    next(err);
  }
};
module.exports = {
  renderAddMainCategoryForm,
  processAddMainCategoryRequest,
  renderAddSubCategoryForm,
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
};
