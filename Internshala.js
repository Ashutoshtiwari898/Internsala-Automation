require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path"); // Add path module

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
    let allInternshipsPromise = page.$$(".easy_apply", { delay: 50 });
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

async function internshipApply(selector) {
  try {
    await page.evaluate((sel) => sel.click(), selector);
    await waitAndClick('button[id="continue_button"]', page);
    await waitAndClick('a[class="copyCoverLetterTitle"]', page);

    await page.waitForSelector('input[type="file"]');
    const inputUploadHandle = await page.$('input[type="file"]');
    const filePath = path.relative(process.cwd(), "./Resume.pdf");
    await inputUploadHandle.uploadFile(filePath);

    const questionsAndTextAreas = await page.evaluate(() => {
      const questions = Array.from(
        document.querySelectorAll(".assessment_question label")
      );
      const textAreas = Array.from(
        document.querySelectorAll('textarea[placeholder="Enter text ..."]')
      );

      return questions.map((question, index) => ({
        questionText: question.textContent.trim(),
        textAreaName: textAreas[index]
          ? textAreas[index].getAttribute("name")
          : null,
      }));
    });

    for (const { questionText, textAreaName } of questionsAndTextAreas) {
      if (!textAreaName) {
        console.error(`No text area found for question: ${questionText}`);
        continue;
      }

      console.log(`Assessment Question: ${questionText}`);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(
        questionText +
          ". Write in less than 100 words." +
          " This is my resume: " +
          process.env.RESUME_DATA
      );
      const response = await result.response;
      const text = await response.text();
      console.log(`Response Text: ${text}`);
      await page.type(`textarea[name="${textAreaName}"]`, text, { delay: 50 });
    }

    await waitAndClick('button[id="submit_application"]', page);

    console.log("Application submitted successfully!");
  } catch (error) {
    console.error("Error during application process: ", error);
  }
}
