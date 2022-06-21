const User = require("../models/User");
const router = require("../routes/admin");

const displayUsers = async (req, res, next) => {
  try {
    const users = await User.find({ active: true });
    res.render("admin/users", { users });
  } catch (err) {
    next(err);
  }
};

// block a user
const blockUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndUpdate(id, { isBlocked: true });
    res.redirect("/admin/users");
  } catch (err) {
    next(err);
  }
};

// unblock a user
const unblockUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndUpdate(id, { isBlocked: false });
    res.redirect("/admin/users");
  } catch (err) {
    next(err);
  }
};

// Delete a user
const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    res.redirect("/admin/users");
  } catch (err) {
    next(err);
  }
};
module.exports = { displayUsers, blockUser, unblockUser, deleteUser };
