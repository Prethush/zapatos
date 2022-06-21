const express = require("express");
const app = express();
const adminRouter = require("./routes/admin");
const path = require("path");
const userRouter = require("./routes/user");
const logger = require("morgan");
const flash = require("connect-flash");
const session = require("express-session");
const dotenv = require("dotenv");
const indexRouter = require("./routes/index");
const cookieParser = require("cookie-parser");

dotenv.config({ path: "config/config.env" });

// middlewares
app.use(cookieParser());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(flash());
app.use(
  session({
    secret: process.env.SECRET,
    saveUninitialized: false,
    resave: false,
  })
);
// views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// routes
app.use("/", indexRouter);
app.use("/admin", adminRouter);
app.use("/users", userRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  let { admin_token, user_token } = req.cookies;
  res.render("page_not_found", { admin_token, user_token });
});

app.use((err, req, res, next) => {
  res.json({ msg: err.message });
});

module.exports = app;
