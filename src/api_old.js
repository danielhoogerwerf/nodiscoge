const axios = require("axios");

class ApiData {
  constructor(token, user, headers) {
    this.user = user;
    this.headers = headers;
    this.token = token;
    this.discogsWantListUrl = "https://api.discogs.com/users/";
    this.discogsMarketPlaceUrl =
      "https://api.discogs.com/marketplace/listings/";
    this.discogsRssUrl = "https://www.discogs.com/sell/release/";
  }

  apiLimitReached(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  errorMessage(error) {
    if (error === "limit") {
      console.log("API Limit reached. Waiting for a minute.");
      return apiLimitReached(60001);
    } else {
      throw error;
    }
  }

  fetchData(url, func) {
    const onError = (msg) => {
      return this.errorMessage(msg).then(() => func());
    };
    return axios
      .get(url, {
        headers: this.headers,
        params: { token: this.token },
        timeout: 10000,
      })
      .then((response) => {
        if (!response.headers["x-discogs-ratelimit-remaining"]) {
          onError("limit");
        }
        return {
          data: response.data,
          limit: response.headers["x-discogs-ratelimit-remaining"],
        };
      })
      .catch((error) => onError(error));
  }

  // getApiWantList() {
  //   const urlPagination = [];
  //   const itemList = [];
  //   const getData = this.fetchData(
  //     `${this.discogsWantListUrl}${this.user}/wants`,
  //     this.getApiWantList
  //   );
  //    return getData
  //     .then((r) => {
  //       // Get the amount of pages to query
  //       const totalPages = r.data.pagination.pages;
  //       if (totalPages > 1) {
  //         for (let i = 1; i < totalPages; i++) {
  //           urlPagination.push(
  //             r.data.pagination.urls.next.replace("&page=2", `&page=${i + 1}`)
  //           );
  //         }
  //       }

  //       // Split the first results in the itemList array
  //       r.data.wants.forEach((e) => {
  //        itemList.push(`${this.discogsRssUrl}${e.resource_url.split("/").slice(-1)[0]}`)
  //       });
  //     })
  //     .then(() => {
  //       //return releases
  //       urlPagination.forEach((url) => {
  //         console.log(url);
  //         this.fetchData(url, this.getApiWantList).then((res) => {
  //           res.data.wants.forEach((e) => {
  //             console.log(e.resource_url.split("/").slice(-1)[0]);
  //             itemList.push(
  //               `${this.discogsRssUrl}${e.resource_url.split("/").slice(-1)[0]}`
  //             );
  //           });
  //         })
  //         .then(() => itemList)
  //       });
  //     })
  //     .then((releases2) => {
  //       //console.log(itemList);
  //       //return releases2
  //     });
  // }

  async getApiWantList() {
    const urlPagination = [];
    const itemList = [];
    let location = 0;
    const getFirstData = async () => {
      return await this.fetchData(
      `${this.discogsWantListUrl}${this.user}/wants`,
      this.getApiWantList
    );
  }

      await getFirstData
      .then((r) => {
        // Get the amount of pages to query
        const totalPages = r.data.pagination.pages;
        if (totalPages > 1) {
          for (let i = 1; i < totalPages; i++) {
            urlPagination.push(
              r.data.pagination.urls.next.replace("&page=2", `&page=${i + 1}`)
            );
          }
        }

        // Split the first results in the itemList array
        r.data.wants.forEach((e) => {
          itemList.push(
            `${this.discogsRssUrl}${e.resource_url.split("/").slice(-1)[0]}`
          );
        });
      })
      .then(() => {
        await Promise.all(
          urlPagination.map((u) => this.fetchData(u, this.getApiWantList))
        )
          .then((res) => {
            res.forEach((arr) => {
              arr.data.wants.forEach((arr2) => {
                itemList.push(
                  `${this.discogsRssUrl}${
                    arr2.resource_url.split("/").slice(-1)[0]
                  }`
                );
              });
            });
          })
          .then(() => {
            // console.log(itemList);
            console.log(itemList.length);
            return itemList;
          });
        return itemList;
      });
  }
}

module.exports = ApiData;
