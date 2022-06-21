const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const URLSlug = require("mongoose-slug-generator");

mongoose.plugin(URLSlug);

const variantSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },

    color: [{ type: String, required: true }],
    images: [
      {
        type: Object,
        required: true,
      },
    ],
    slug: {
      type: String,
      slug: "name",
      unique: true,
    },
    size: [{ type: Schema.Types.ObjectId, ref: "Size" }],
  },

  { timestamps: true }
);

variantSchema.pre("save", function (next) {
  this.slug = this.name.split(" ").join("-");
  next();
});
const Variant = mongoose.model("Variant", variantSchema);
module.exports = Variant;
