```
 _   _       ____  _                          
| \ | | ___ |  _  (_)___  ___ ___   __ _  ___
|  \| |/ _  | | | | / __|/ __/ _ \ / _, |/ _ \
| |\  | (_) | |_| | \__ \ (_| (_) | (_| |  __/ 
|_| \_|\___/|____/|_|___/\___\___/ \__, |\___| 
                                   |___/  v0.3 
```                                   
## NodeJS Asynchronous Discogs Want List Processor

>_Ever wondered when your favorite vinyl record could be on sale for a good price on Discogs without checking every one of your want list items manually all the time?_

This program processes your want list items and stores the results based on a configured quality filter into a MongoDB instance. The results are in JSON format and can be extracted and formatted into your desired front-end system.


#### Short manual

Create an **.env** file in the root folder with the following data:

`MONGODB_URL=YOUR MONGODB CONNECT URL`

`DISCOGS_TOKEN=YOUR DISCOGS DEVELOPER USER TOKEN` (Generate one in your profile here: https://www.discogs.com/settings/developers)

`DISCOGS_USER=YOUR DISCOGS USERNAME`

Then configure your desired quality in the main.js file and kick off the program with **npm start**

### JSON Output Format
```
releaseid: Release Number of Discogs vinyl
releasehistory: Array with each object having the following information:
  - date: Capture date
    - releasedata: Array with each object containing marketplace results:
      - MediaCondition: String
      - SleeveCondition: String
      - price: String (with currency symbol)
```
