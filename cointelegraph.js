const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs"); // Import fs package

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

// Scraping Forbes articles
async function scrapeAllPages() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage();
  const url = "https://cointelegraph.com/tags/rwa-tokenization";
  let articlesData = [];

  async function scrapePage(url) {
    await page.goto(url, { timeout: 0 });

    // Wait for images to load
    await page.waitForSelector(".post-card-inline .lazy-image__img", {
      visible: true,
    });

    // Adding a delay for images to load fully
    await delay(3000); // Wait for 3 seconds

    // Extract articles data from the list page
    let pageData = await page.evaluate(() => {
      let articles = [];
      document.querySelectorAll(".post-card-inline").forEach((article) => {
        let linkElement = article.querySelector("a");
        let imgElement = article.querySelector(".lazy-image__img");

        let dateElement = article.querySelector(
          ".post-card-inline__content .post-card-inline__meta time"
        );
        let authorElement = article.querySelector(
          ".post-card-inline__content .post-card-inline__meta .post-card-inline__author"
        );
        let titleElement = article.querySelector(
          ".post-card-inline__content>.post-card-inline__header>a>span"
        );
        let descriptionElement = article.querySelector(
          ".post-card-inline__text"
        );

        let link = linkElement ? linkElement.getAttribute("href") : null;
        let img = imgElement ? imgElement.getAttribute("src") : null;
        let title = titleElement ? titleElement.textContent.trim() : null;
        let date = dateElement ? dateElement.textContent.trim() : null;
        let author = authorElement ? authorElement.textContent.trim() : null;
        let description = descriptionElement
          ? descriptionElement.textContent.trim()
          : null;

        articles.push({
          title: title || "No title",
          date: date || "No date",
          author: author || "No author",
          img: img || "No image",
          link: `https://cointelegraph.com${link}` || "No link",
          description: description || "No description",
        });
      });
      return articles;
    });

    return pageData;
  }

  // Scrape the given URL
  articlesData = await scrapePage(url);

  // Log the collected articles data
  console.log("Scraped Articles Data:", articlesData);

  // Save the data to a JSON file (optional)
    fs.writeFileSync(
      "cointelegraph.json",
      JSON.stringify(articlesData, null, 2),
      "utf-8"
    );
    console.log("Data has been saved to cointelegraph.json");

  // Close the browser
  // await browser.close();
}

scrapeAllPages();
