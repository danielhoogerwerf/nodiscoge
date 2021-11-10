import { createRequire } from "module";
const require = createRequire(import.meta.url);

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const vinylSchema = new Schema(
  {
    // Store the media, sleeve, price and run date information inside the 'releasedata' array
    releaseid: Number,
    releasehistory: Array,
  },
  { timestamps: true }
);

const vinylDatas = mongoose.model("VinylData", vinylSchema);
export { vinylDatas };
