import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mongoose = require("mongoose");
require("dotenv").config();

import { vinylDatas } from "../models/vinylData.mjs";

const connectDb = () => {
  console.log("Performing a connection attempt to MongoDB.");
  return mongoose
    .connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((x) => {
      console.log(
        `Connected to Mongo! Host: ${x.connections[0].host}, Port: ${x.connections[0].port}, Database name: "${x.connections[0].name}"`
      );
    })
    .catch((error) => {
      throw `Error connecting to mongo: ${error}`;
    });
};

const updateRecord = async (releaseid, itemarray) => {
  try {
    let ifExists = await vinylDatas.find({ releaseid: releaseid });
    if (ifExists.length < 1) {
      console.log(
        "Release ID not found in the database. Creating a new record."
      );
    }

    return ifExists.length >= 1
      ? vinylDatas.updateOne(
          {
            releaseid: releaseid,
          },
          {
            $addToSet: {
              releasehistory: [{ date: new Date(), releasedata: itemarray }],
            },
          }
        )
      : vinylDatas.create({
          releaseid: releaseid,
          releasehistory: {
            date: new Date(),
            releasedata: itemarray,
          },
        });
  } catch (error) {
    throw error;
  }
};

export { connectDb, updateRecord };
