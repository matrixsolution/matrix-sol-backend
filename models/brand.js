const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    brandId: {
      type: String,
      unique: true,
      required: true,
    },
    brandname: {
      type: String,
      unique: true,
      required: true,
    },
    brandimage: {
      type: String,
    },
    public_id: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Brand", brandSchema);
