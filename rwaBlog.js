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
  const url = "https://www.rwa.xyz/blog";
  let articlesData = [];

  async function scrapePage(url) {
    await page.goto(url, { timeout: 0 });
   
    // Extract articles data from the list page
    let pageData = await page.evaluate(() => {
      let articles = [];
      document.querySelectorAll(".w-dyn-item").forEach((article) => {
        let linkElement = article.querySelector("a");
        let imgElement = article.querySelector(".blog-image-wrapper>img");
        let dateElement = article.querySelector(".blog-date>.label-small");
        let CategoryElement = article.querySelector(".blog-badge");
        let titleElement = article.querySelector(".heading-13");

        let link = linkElement ? linkElement.getAttribute("href") : null;
        let img = imgElement ? imgElement.getAttribute("src") : null;
        let title = titleElement ? titleElement.textContent.trim() : null;
        let date = dateElement ? dateElement.textContent.trim() : null;
        let category = CategoryElement ? CategoryElement.textContent.trim() : null;

        articles.push({
          title: title || "No title",
          date: date || "No date",
          category: category || "No author",
          img: img || "No image",
          link: `https://www.rwa.xyz/${link}` || "No link",
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
  fs.writeFileSync("rwaBlog.json", JSON.stringify(articlesData, null, 2), "utf-8");
  console.log("Data has been saved to rwaBlog.json");

  // Close the browser
  // await browser.close();
}

scrapeAllPages();
