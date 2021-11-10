import { ApiData } from "./src/api.mjs";
import { getWebData } from "./src/webdata.mjs";
import { connectDb, updateRecord } from "./src/mongodb.mjs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
require("dotenv").config();

// CONFIGURATION
//
// Create an .env file with the following data:
// MONGODB_URL=YOUR MONGODB CONNECT URL
// DISCOGS_TOKEN=YOUR DISCOGS DEVELOPER USER TOKEN (Generate one here: https://www.discogs.com/settings/developers)
// DISCOGS_USER=YOUR DISCOGS USERNAME

// Update here your preferences for the program
const qualityWanted = ["Near Mint (NM or M-)", "Mint (M)"]; // Other options: 'Very Good Plus (VG+)', 'Very Good (VG)', 'Good Plus (G+)', 'Good (G)', 'Fair (F)', ''Generic', 'No Cover', 'Not Graded'
const currency = ["€"]; // Which currencies you want to collect within the results

// Specify a unique User-Agent, as written in the Discogs API requirements for authenticated requests.
const HEADERS = { "User-Agent": "NoDiscoge/0.1" };

// User-agent for non authenticated queries.
const HEADERS_WEB = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15",
};


// MAIN APPLICATION
const client_token = process.env.DISCOGS_TOKEN; 
const discogsUser = process.env.DISCOGS_USER; 

const GetApi = new ApiData(client_token, discogsUser, HEADERS);

const getRandomNumber = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};

let connect = async () => {
  return await connectDb();
};

let getApiData = async () => {
  console.log('Obtaining wantlist results.')
  let result = await GetApi.getApiWantList();
  if (result.length > 1) {
    console.log(`Found ${result.length} want list items.`);
    console.log(" ")
    return result;
  } else {
    throw Error("Wantlist empty. Cannot proceed.");
  }
};

let getApiResults = async (apiReleaseId) => {
  const itemArray = [];
  let ReleaseId = apiReleaseId.split("/").slice(-1)[0];

  // Table declarations (Google DevTools is helpful here)
  const itemQualityColumn = (element) =>
    element.rawAttrs === 'class="item_description"'; // td.item_description
  const itemQualityCell = (element) =>
    element.rawAttrs === 'class="item_condition"'; // p.item_condition

  const itemPriceColumn = (element) =>
    element.rawAttrs === 'class="item_price hide_mobile"'; // td.item_price.hide_mobile
  const itemPriceCell = (element) => element.rawAttrs === 'class="price"'; // span.price

  console.log(`Getting web data for release ${ReleaseId}...`);
  let html = await getWebData(apiReleaseId, HEADERS_WEB);

  console.log(`Done. Formatting data.`);
  html.forEach((cells) => {
    // Grab correct array number
    let ItemQualityArray1 = cells.childNodes.findIndex(itemQualityColumn);
    let ItemQualityArray2 =
      cells.childNodes[ItemQualityArray1].childNodes.findIndex(itemQualityCell);
    let itemPriceArray1 = cells.childNodes.findIndex(itemPriceColumn);
    let ItemPriceArray2 =
      cells.childNodes[itemPriceArray1].childNodes.findIndex(itemPriceCell);

    // Obtain needed data
    let SleeveCondition;
    // ReleaseId = cells._rawAttrs["data-release-id"];
    let MediaCondition =
      cells.childNodes[ItemQualityArray1].childNodes[
        ItemQualityArray2
      ].childNodes[5].innerText.trim();
    if (
      typeof cells.childNodes[ItemQualityArray1].childNodes[ItemQualityArray2]
        .childNodes[13] !== "undefined"
    ) {
      SleeveCondition =
        cells.childNodes[ItemQualityArray1].childNodes[
          ItemQualityArray2
        ].childNodes[13].innerText.trim();
    }

    let price =
      cells.childNodes[itemPriceArray1].childNodes[
        ItemPriceArray2
      ].innerText.trim();

    // Filter results based on qualityWanted configuration settings
    if (
      qualityWanted.includes(MediaCondition) &&
      qualityWanted.includes(SleeveCondition) &&
      price.includes(currency)
    ) {
      itemArray.push({ MediaCondition, SleeveCondition, price });
    }
  });

  // Update the database with the result
  console.log(`Updating database with results.`);
  await updateRecord(ReleaseId, itemArray);

  console.log(`Release ${ReleaseId} finished processing. Going to next item.`);
  console.log(" ")
};

const mainProgram = async () => {
  await connect();
  let apiData = await getApiData();
  let apiDataLength = apiData.length

  let promise = Promise.resolve();
  apiData.forEach(function (item) {
    promise = promise.then(function () {
      console.log(`Remaining amount: ${apiDataLength}`)
      getApiResults(item);
      apiDataLength--
      return new Promise(function (resolve) {
        setTimeout(resolve, getRandomNumber(1000, 4000));
      });
    });
  });

  promise.then(function () {
    console.log("All done! Program finished.");
  });
};


// RUN MAIN PROGRAM
console.log(` _   _       ____  _                           `)             
console.log(`| \\ | | ___ |  _ \\(_)___  ___ ___   __ _  ___  `)
console.log(`|  \\| |/ _ \\| | | | / __|/ __/ _ \\ / _, |/ _ \\ `)
console.log(`| |\\  | (_) | |_| | \\__ \\ (_| (_) | (_| |  __/ `)
console.log(`|_| \\_|\\___/|____/|_|___/\\___\\___/ \\__, |\\___| `)
console.log(`NodeJS Discogs Wantlist Processor" |___/  v0.1 `)
console.log(``)
console.log(``)
mainProgram();
