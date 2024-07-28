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
  })
  .then(function () {
    return page.type("input[id='email']", process.env.EMAIL, { delay: 50 }); // Type email
  })
  .then(function () {
    return page.type("input[id='password']", process.env.PASSWORD, {
      delay: 50,
    }); // Type password
  })
  .then(function () {
    return page.click('button[id="login_submit"]', { delay: 40 }); // Click login button
  })
  .then(function () {
    return page.waitForNavigation(); // Wait for navigation after login
  })
  .then(function () {
    return waitAndClick('a[id="internships_new_superscript"]', page, {
      delay: 1000,
    }); // Click on internships link
  })
  .then(function () {
    return waitAndClick('input[id="matching_preference"]', page, {
      delay: 1000,
    }); // Click on matching preference
  })
  .then(function () {
    let allInternshipsPromise = page.$$(".easy_apply", {
      delay: 50,
    });
    return allInternshipsPromise;
  })
  .then(async function (internshipsArray) {
    console.log("Number of internships: ", internshipsArray.length);
    await internshipApply(internshipsArray[0]);
  })
  .catch(function (err) {
    console.error("Error: ", err);
  });

function waitAndClick(selector, cPage) {
  return new Promise(function (resolve, reject) {
    cPage
      .waitForSelector(selector)
      .then(function () {
        return cPage.click(selector);
      })
      .then(function () {
        resolve();
      })
      .catch(function (error) {
        reject(error);
      });
  });
}
