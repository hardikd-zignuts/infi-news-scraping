const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const { v4: uuidv4 } = require("uuid"); // Import uuid package

async function scrapeAllPages() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage();

  let currentPage = 1;
  let articlesData = [];

  // Function to scrape a single page
  async function scrapePage(url) {
    await page.goto(url, { timeout: 0 });
    // Extract articles data from the list page
    let pageData = await page.evaluate(() => {
      let articles = [];
      document
        .querySelectorAll(
          "#bic-main-content > div.flex.flex-wrap.-mx-3.lg:mx-0.lg:justify-between > div:nth-child(1)"
        )
        .forEach((article) => {
          let link = article.querySelector(
            "div.shrink-0.rounded-lg.md:rounded-xl.mb-2.5.md:mb-3.max-w-full.overflow-hidden > a"
          )?.href;
          let img = article.querySelector(
            "div.shrink-0.rounded-lg.md:rounded-xl.mb-2.5.md:mb-3.max-w-full.overflow-hidden > a > img"
          )?.srcset;
          let title = article
            .querySelector(
              "div.flex.flex-col.justify-between.w-full.lg:h-full > h5 > a"
            )
            ?.textContent.trim();
          let category = article
            .querySelector(
              "div.flex.flex-col.justify-between.w-full.lg:h-full > div.flex.flex-wrap.gap-x-2.gap-y-0.5.text-dark-grey-700.p4.mb-1.gap-x-3 > a.whitespace-nowrap.hover:underline.dark:text-white > span"
            )
            ?.textContent.trim(); // Updated to target the first category link
          let date = article
            .querySelector(
              "div.flex.flex-col.justify-between.w-full.lg:h-full > div.flex.items-center.text-grey-700.[.dark_&]:text-white.p5.gap-x-4 > time.ago.whitespace-nowrap"
            )
            ?.textContent.trim(); // Updated to target the date in the 'time.ago' element

          articles.push({
            title: title || "No title",
            link: link || "No link",
            img: img || "No img",
            category: category || "No category",
            date: date || "No data",
          });
        });
      return articles;
    });

    // Add UUIDs in Node.js context
    pageData = pageData.map((article) => ({
      ...article,
    }));

    return pageData;
  }

  // Loop to go through each page
  const url = "https://beincrypto.com/news/";
  let pageData = await scrapePage(url);

  // Check if the first page has any articles
  if (pageData.length === 0) {
    console.log("No articles found on the first page.");
  } else {
    console.log("Articles found on the first page:", pageData);
  }

  // If needed, you can store the data for further testing

  console.log(pageData);
  // Save the data to a JSON file
  //   fs.writeFile(
  //     "beincrypto.json",
  //     JSON.stringify(articlesData, null, 2),
  //     (err) => {
  //       if (err) {
  //         console.error("Failed to write to file:", err);
  //       } else {
  //         console.log("Data successfully saved to scrapedData.json");
  //       }
  //     }
  //   );

  //   await browser.close();
}

scrapeAllPages();
