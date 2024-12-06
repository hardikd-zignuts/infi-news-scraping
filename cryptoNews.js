const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const { v4: uuidv4 } = require("uuid"); // Import uuid package

async function scrapeAllPages() {
  const browser = await puppeteer.launch({
    headless: false,
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
        .querySelectorAll(".archive-template-latest-news-list-mini")
        .forEach((article) => {
          let link = article.querySelector("a")?.href;

          let title = article
            .querySelector(
              ".archive-template-latest-news__inner>.archive-template-latest-news__title"
            )
            ?.textContent.trim();
          let category = article
            .querySelector(".news-one-info>.news-one-category")
            ?.textContent.trim(); // Update with correct class
          let badge = article
            .querySelector(
              ".archive-template-latest-news__inner>.archive-template-latest-news__label"
            )
            ?.textContent.trim(); // Update with correct class
          let description = article
            .querySelector(
              ".archive-template-latest-news__inner>.archive-template-latest-news__description"
            )
            ?.textContent.trim(); // Update with correct class
          let timeElement = document.querySelector(
            ".archive-template-latest-news__time"
          ); // Update with correct class
          let date = timeElement?.dataset.utctime;
          let author = article
            .querySelector(
              ".archive-template-latest-news__inner>.archive-template-latest-news__info>.archive-template-latest-news__author"
            )
            ?.textContent.replace(/[\s,]+/, ""); // Update with correct class

          articles.push({
            title: title || "No title",
            link: link || "No link",
            img: "No img",
            category: category || "No category",
            badge: badge || "No data",
            description: description || "No description",
            author: author || "No author",
            date : date || "No date"
          });
        });
      return articles;
    });

    // Add UUIDs in Node.js context
    pageData = pageData.map((article) => ({
      id: uuidv4(),
      ...article,
    }));

    return pageData;
  }

  // Loop to go through each page
  while (true) {
    if (currentPage < 6) {
      const url =
        currentPage === 1
          ? "https://cryptonews.com/news/bitcoin-news/"
          : `https://cryptonews.com/news/bitcoin-news/page/${currentPage}/`;
      let pageData = await scrapePage(url);

      // Check if the current page has any articles
      if (pageData.length === 0) {
        console.log("No more articles found. Exiting...");
        break;
      }

      articlesData = articlesData.concat(pageData);
      currentPage++;
    } else {
      break;
    }
  }

  console.log(articlesData);

  // Save the data to a JSON file
  fs.writeFile(
    "cryptoNews.json",
    JSON.stringify(articlesData, null, 2),
    (err) => {
      if (err) {
        console.error("Failed to write to file:", err);
      } else {
        console.log("Data successfully saved to scrapedData.json");
      }
    }
  );

  // await browser.close();
}

scrapeAllPages();
