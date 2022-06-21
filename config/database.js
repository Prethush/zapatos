const mongoose = require("mongoose");
const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_URL)
    .then((data) => {
      console.log(`Mongodb is connected`);
    })
    .catch((err) => {
      console.log("not connected");
    });
};

module.exports = connectDatabase;
