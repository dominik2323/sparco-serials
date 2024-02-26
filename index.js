const fs = require("fs");
const { parse } = require("@fast-csv/parse");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const apiUrl = "https://api.eu1.prepr.io/content_items";

function getTimeStamp() {
  return Math.floor(Date.now() / 1000);
}
function formatDate(date) {
  let date_string = "6/1/2021";
  let date_object = new Date(date_string);

  let year = date_object.getFullYear();
  let month = ("0" + (date_object.getMonth() + 1)).slice(-2); // Months are 0-based in JavaScript
  let day = ("0" + date_object.getDate()).slice(-2);

  return `${year}-${month}-${day}`;
}

function delay() {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, 1000);
  });
}

function createQuery(data) {
  return {
    model: {
      id: "fd9618f5-6170-4c23-8dd2-c0c652b9ac77",
    },
    publish_on: {
      "en-US": getTimeStamp(),
    },
    locales: ["en-US"],
    workflow_stage: {
      "en-US": "Done",
    },
    status: {
      "en-US": {
        body: "Done",
      },
    },
    items: {
      "en-US": {
        serial_number: {
          body: data.serial_number,
        },
        serial_id: {
          body: data.serial_id,
        },
        serial_production_date: {
          format: "Y-m-d",
          value: formatDate(data.serial_production_date),
        },
      },
    },
  };
}

async function populateData() {
  return new Promise((resolve, reject) => {
    let data = [];

    fs.createReadStream("./data.csv")
      .pipe(parse({ objectMode: true, headers: true }))
      .on("error", (error) => {
        console.error(error);
        reject(error);
      })
      .on("data", (row) => {
        data.push(createQuery(row));
      })
      .on("end", () => {
        resolve(data);
      });
  });
}

populateData().then((data) => {
  const _data = data[0].items;
  console.log(data[0].items);
  axios
    .post(`https://api.eu1.prepr.io/content_items`, _data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REST_TOKEN}`,
      },
    })
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.error(error.response.data);
    });
});
