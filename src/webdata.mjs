import { parse } from "node-html-parser";
import { createRequire } from "module";
import { updateRecord } from "./mongodb.mjs";
const require = createRequire(import.meta.url);
const axios = require("axios");

const getWebData = async (url, headers) => {
  try {
    // Identifier for the main table array separator
    const tableTrClassString = ".shortcut_navigable";

    const webResponse = await axios.get(url, {
      headers: headers,
      timeout: 10000,
    });

    const htmlData = parse(webResponse.data);
    return htmlData.querySelectorAll(tableTrClassString);
  } catch (error) {
    throw error;
  }
};

const getWebResults = async (
  apiReleaseId,
  headers_config,
  qualityWanted,
  currency
) => {
  try {
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

    console.log(`Getting web data for release ID: ${ReleaseId}...`);
    const html = await getWebData(apiReleaseId, headers_config);

    console.log(`Done. Formatting data.`);
    html.forEach((cells) => {
      // Grab correct array number
      const ItemQualityArray1 = cells.childNodes.findIndex(itemQualityColumn);
      const ItemQualityArray2 =
        cells.childNodes[ItemQualityArray1].childNodes.findIndex(
          itemQualityCell
        );
      const itemPriceArray1 = cells.childNodes.findIndex(itemPriceColumn);
      const ItemPriceArray2 =
        cells.childNodes[itemPriceArray1].childNodes.findIndex(itemPriceCell);

      // Obtain needed data
      let SleeveCondition;
      // ReleaseId = cells._rawAttrs["data-release-id"];
      const MediaCondition =
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

      const price =
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
    console.log(`Done. Updating database with results.`);
    await updateRecord(ReleaseId, itemArray);

    console.log(`Finished processing release ID: ${ReleaseId}.`);
    console.log(" ");
  } catch (error) {
    throw error;
  }
};

export { getWebResults };
