const puppeteer = require("puppeteer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid"); // Import uuid package

async function scrapeAllPages() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  let currentPage = 0;
  let articlesData = [];

  // Function to scrape a single page
  async function scrapePage(url) {
    await page.goto(url, { timeout: 0 });
    console.log(`Scraping page: ${url}`);

    // Extract articles data from the list page
    let pageData = await page.evaluate(() => {
      let articles = [];
      document.querySelectorAll(".articleCard").forEach((article) => {
        let title = article
          .querySelector(".articleCard__content>.articleCard__text>a>h2>span")
          ?.textContent.trim();
        let link = article.querySelector("a")?.href;
        let img = article.querySelector("a>img")?.src;
        let date = article
          .querySelector(
            ".articleCard__content>.articleCard__meta>.meta__wrapper"
          )
          ?.textContent.trim(); // Update with correct class
        let category = article
          .querySelector(
            ".articleCard__content>.articleCard__meta>.meta__wrapper>.meta__category"
          )
          ?.textContent.trim(); // Update with correct class

        articles.push({
          title: title || "No title",
          link: `https://www.theblock.co/${link}` || "No link",
          date: date || "No date",
          category: category || "No category",
          img: `https://www.theblock.co/${img}` || "No data",
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
    const url = `https://www.theblock.co/latest?start=${currentPage}`;
    let pageData = await scrapePage(url);

    // Check if the current page has any articles
    if (pageData.length === 0) {
      console.log("No more articles found. Exiting...");
      break;
    }

    articlesData = articlesData.concat(pageData);
    currentPage += 10; // Increment by 10 for the next page
  }
  console.log(articlesData);

  // Save the data to a JSON file
  fs.writeFile(
    "theblock.json",
    JSON.stringify(articlesData, null, 2),
    (err) => {
      if (err) {
        console.error("Failed to write to file:", err);
      } else {
        console.log("Data successfully saved to theblock.json");
      }
    }
  );

  await browser.close();
}

scrapeAllPages();
