import { DiscogsAPI } from "./src/api.mjs";
import { getWebResults } from "./src/webdata.mjs";
import { connectDb } from "./src/mongodb.mjs";
import { createRequire } from "module";
import { sleepTimer } from "./src/sleep.mjs";
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
const Api = new DiscogsAPI(client_token, discogsUser, HEADERS);

const getRandomNumber = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const getApiData = async () => {
  try {
    console.log("Obtaining wantlist results.");
    const result = await Api.getApiWantList();
    if (result.length > 1) {
      console.log(`Found ${result.length} want list items.`);
      console.log(" ");
      return result;
    } else {
      throw Error("Wantlist empty. Cannot proceed.");
    }
  } catch (error) {
    console.log(error);
  }
};

const mainProgram = async () => {
  try {
    await connectDb();
    const apiDataResults = await getApiData();
    let AmountOfApiItems = apiDataResults.length;

    for (const containedUrl of apiDataResults) {
      console.log(`Remaining amount: ${AmountOfApiItems}`);
      await getWebResults(containedUrl, HEADERS_WEB, qualityWanted, currency);
      AmountOfApiItems--;
      await sleepTimer(getRandomNumber(500, 4000));
    }
    console.log("All done! Program finished.");
  } catch (error) {
    console.log(error);
  }
};

// RUN MAIN PROGRAM
console.log(` _   _       ____  _                           `);
console.log(`| \\ | | ___ |  _ \\(_)___  ___ ___   __ _  ___  `);
console.log(`|  \\| |/ _ \\| | | | / __|/ __/ _ \\ / _, |/ _ \\ `);
console.log(`| |\\  | (_) | |_| | \\__ \\ (_| (_) | (_| |  __/ `);
console.log(`|_| \\_|\\___/|____/|_|___/\\___\\___/ \\__, |\\___| `);
console.log(`NodeJS Discogs Wantlist Processor" |___/  v0.3 `);
console.log(``);
console.log(``);
mainProgram();
