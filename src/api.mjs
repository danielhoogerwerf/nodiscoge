import { sleepTimer } from "./sleep.mjs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const axios = require("axios");

class DiscogsAPI {
  constructor(token, user, headers) {
    this.user = user;
    this.headers = headers;
    this.token = token;
    this.apiLimit = 1000;
    this.discogsWantListUrl = "https://api.discogs.com/users/";
    this.discogsMarketPlaceUrl =
      "https://api.discogs.com/marketplace/listings/";
    this.apiReleaseUrl = "https://api.discogs.com/releases/";
    this.discogsRssUrl = "https://www.discogs.com/sell/release/";
  }

  fetchData(url) {
    const performConnection = async () => {
      try {
        // Limit of 10 is based on tests. Seems to pause the requests properly.
        if (this.apiLimit <= 10) {
          console.log("The API limit has been hit. Pausing the download of the URL.");
          await sleepTimer(60001);
          console.log("Limit has been reset. Resuming operation.")
        }

        const response = await axios.get(url, {
          headers: this.headers,
          params: { token: this.token },
          timeout: 10000,
        });

        this.apiLimit = response.headers["x-discogs-ratelimit-remaining"];
        //console.log(`Remaining API calls: ${this.apiLimit}`);
        return {
          data: response.data,
          limit: this.apiLimit,
        };
      } catch (error) {
        throw error;
      }
    };
    return performConnection();
  }

  getWantListData() {
    return this.fetchData(`${this.discogsWantListUrl}${this.user}/wants`);
  }

  createUrlPages(urls) {
    const urlPagination = [];

    // Get the amount of pages to query
    const totalPages = urls.data.pagination.pages;

    // Loop if more than one page is present
    if (totalPages > 1) {
      for (let i = 1; i < totalPages; i++) {
        urlPagination.push(
          urls.data.pagination.urls.next.replace("&page=2", `&page=${i + 1}`)
        );
      }
    } else {
      urlPagination.push(urls.data.pagination.urls.next);
    }
    return urlPagination;
  }

  splitWantListResults(data) {
    const results = [];
    data.forEach((arr) => {
      results.push(
        `${this.discogsRssUrl}${
          arr.basic_information.resource_url.split("/").slice(-1)[0]
        }`
      );
    });
    return results;
  }

  getParallelPageResults(urls) {
    return Promise.all(urls.map((u) => this.fetchData(u)));
  }

  parseRemainingData(data) {
    const results = [];
    data.forEach((arr) => {
      let wantList = this.splitWantListResults(arr.data.wants);
      results.push(...wantList);
    });
    return results;
  }

  getApiWantList() {
    const results = [];

    const getData = async () => {
      try {
        const getWantListData = await this.getWantListData();

        const getPages = this.createUrlPages(getWantListData);
        const getFirstResults = this.splitWantListResults(
          getWantListData.data.wants
        );

        const getRemainingData = await this.getParallelPageResults(getPages);
        const remainingData = this.parseRemainingData(getRemainingData);
        results.push(...getFirstResults, ...remainingData);
        return results;
      } catch (error) {
        throw error;
      }
    };

    return getData();
  }
}

export { DiscogsAPI };
