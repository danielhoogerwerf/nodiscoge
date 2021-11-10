import { createRequire } from 'module'
const require = createRequire(import.meta.url);
const axios = require("axios")

class ApiData {
  constructor(token, user, headers) {
    this.user = user;
    this.headers = headers;
    this.token = token;
    this.discogsWantListUrl = "https://api.discogs.com/users/";
    this.discogsMarketPlaceUrl =
      "https://api.discogs.com/marketplace/listings/";
    this.apiReleaseUrl = "https://api.discogs.com/releases/";
    this.discogsRssUrl = "https://www.discogs.com/sell/release/";
  }

  apiLimitReached(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  fetchData(url, funct) {
    const onError = (msg) => {
      return msg.then(() => funct());
    };
    return axios
      .get(url, {
        headers: this.headers,
        params: { token: this.token },
        timeout: 10000,
      })
      .then((response) => {
        if (!response.headers["x-discogs-ratelimit-remaining"]) {
          console.log("API Limit reached. Waiting for a minute.");
          apiLimitReached(60001);
        }
        
        return {
          data: response.data,
          limit: response.headers["x-discogs-ratelimit-remaining"],
        };
      })
      .catch((error) => onError(error));
  }

  getWantListData() {
    return this.fetchData(
      `${this.discogsWantListUrl}${this.user}/wants`,
      this.getWantListData
    );
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
    return Promise.all(
      urls.map((u) => this.fetchData(u, this.getParallelPageResults))
    );
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
      const getWantListData = await this.getWantListData();
      const getPages = this.createUrlPages(getWantListData);
      const getFirstResults = this.splitWantListResults(
        getWantListData.data.wants
      );

      const getRemainingData = await this.getParallelPageResults(getPages);
      const remainingData = this.parseRemainingData(getRemainingData);
      results.push(...getFirstResults, ...remainingData);

      return results;
    };

    return getData();
  }
}

export {ApiData};
