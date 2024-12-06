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
      document.querySelectorAll(".grid-base-post").forEach((article) => {
        let link = article.querySelector(".media a")?.href;
        let img = article.querySelector(".media a span");
        let title = article
          .querySelector(".content>.post-meta>.post-title>a")
          ?.textContent.trim();
        let category = article
          .querySelector(".content .post-meta .post-meta-items .post-cat a")
          ?.textContent.trim(); // Update with correct class
        let date = article
          .querySelector(
            ".content .post-meta .post-meta-items .date .date-link .post-date"
          )
          ?.textContent.trim(); // Update with correct class
        let description = article
          .querySelector(".content>.excerpt>p")
          ?.textContent.trim();

        articles.push({
          title: title || "No title",
          link: link || "No link",
          img: img || "No img",
          category: category || "No category",
          date: date || "No data",
          description: description || "No data",

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
    const url =
      currentPage === 1
        ? "https://blockonomi.com/all"
        : `https://blockonomi.com/all/page/${currentPage}/`;
    let pageData = await scrapePage(url);

    // Check if the current page has any articles
    if (pageData.length === 0) {
      console.log("No more articles found. Exiting...");
      break;
    }

    articlesData = articlesData.concat(pageData);
    currentPage++;
  }

  // Save the data to a JSON file
  fs.writeFile(
    "blockonomi.json",
    JSON.stringify(articlesData, null, 2),
    (err) => {
      if (err) {
        console.error("Failed to write to file:", err);
      } else {
        console.log("Data successfully saved to scrapedData.json");
      }
    }
  );

  //   await browser.close();
}

scrapeAllPages();
