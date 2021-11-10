import { parse } from "node-html-parser";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const axios = require("axios");


// Identifier for the main table array separator
const tableTrClassString = ".shortcut_navigable";

const getWebData = (url, headers) => {
  return axios
    .get(url, {
      headers: headers,
      timeout: 10000,
    })
    .then((response) => {
      const html = parse(response.data);
      return html.querySelectorAll(tableTrClassString);
    })
    .catch((error) => error);
};

export { getWebData };
