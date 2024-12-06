const puppeteer = require("puppeteer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid"); // Import uuid package

async function scrapeAllPages() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  let currentPage = 1;
  let articlesData = [];

  // Function to scrape a single page
  async function scrapePage(url) {
    await page.goto(url, { timeout: 0 });
    console.log(`Scraping page: ${url}`);

    // Extract articles data from the list page
    let pageData = await page.evaluate(() => {
      let articles = [];
      document.querySelectorAll("article").forEach((article) => {
        let title = article.querySelector("h2")?.textContent.trim();
        let link = article.querySelector("a")?.href;
        let date = article.querySelector(".post-date")?.textContent.trim(); // Update with correct class
        let category = article.querySelector(".category")?.textContent.trim(); // Update with correct class
        let description = article
          .querySelector(".excerpt>p")
          ?.textContent.trim(); // Update with correct class

        articles.push({
          title: title || "No title",
          link: link || "No link",
          date: date || "No date",
          category: category || "No category",
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
        ? "https://blockonomi.com/ai/"
        : `https://blockonomi.com/ai/page/${currentPage}/`;
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
    "parentScrapedData.json",
    JSON.stringify(articlesData, null, 2),
    (err) => {
      if (err) {
        console.error("Failed to write to file:", err);
      } else {
        console.log("Data successfully saved to scrapedData.json");
      }
    }
  );

  await browser.close();
}

scrapeAllPages();
