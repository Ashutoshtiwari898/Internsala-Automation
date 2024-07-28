require("dotenv").config();
const puppeteer = require("puppeteer");
const loginLink = "https://internshala.com/login/student";

let browserOpen = puppeteer.launch({
  headless: false,
  args: ["--start-maximized"],
  defaultViewport: null,
});

let page;

browserOpen
  .then(function (browserObj) {
    let browserOpenPromise = browserObj.newPage(); // Open new page
    return browserOpenPromise;
  })
  .then(function (newTab) {
    page = newTab;
    let internShalaOpenPromise = newTab.goto(loginLink); // Go to login page
    return internShalaOpenPromise;
  });
