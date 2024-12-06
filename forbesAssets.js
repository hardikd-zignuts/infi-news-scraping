const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs"); // Import fs package

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

// due to security issue

async function scrapeAllPages() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage();
  const url = "https://www.forbes.com/digital-assets/news";
  let articlesData = [];

  async function scrapePage(url) {
    await page.goto(url, { timeout: 0 });
  
    // Ensure the page has loaded by waiting for a key element
    await page.waitForSelector("[class^='StreamFeed_streamCard']", { timeout: 10000 });
  
    // Scroll to load more articles
    let originalOffset = 0;
    while (true) {
      console.log("Scrolling down...");
      await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
      let newOffset = await page.evaluate(() => window.pageYOffset);
      if (originalOffset === newOffset) {
        console.log("Reached bottom of the page.");
        break;
      }
      originalOffset = newOffset;
      await delay(1000); // Give time for new content to load
    }
  
    // Extract articles data from the list page
    let pageData = await page
      .evaluate(() => {
        let articles = [];
        document
          .querySelectorAll("[class^='StreamFeed_streamCard']")
          .forEach((article) => {
            let linkElement = article.querySelector("div>div:nth-child(1)>a");
            let imgElement = article.querySelector("div>div:nth-child(1)>a>img");
            let dateElement = article.querySelector(
              "div>div:nth-child(2)>div:nth-child(1)>span"
            );
            let authorElement = article.querySelector(
              "div>div:nth-child(2)>div>a"
            );
            let titleElement = article.querySelector("div>div:nth-child(2)>h3>a");
            let descriptionElement = article.querySelector("div:nth-child(2)>p");
  
            let link = linkElement ? linkElement.getAttribute("href") : null;
            let img = imgElement ? imgElement.getAttribute("src") : null;
            let title = titleElement ? titleElement.textContent.trim() : null;
            let date = dateElement ? dateElement.textContent.trim() : null;
            let autore = authorElement ? authorElement.textContent.trim() : null;
            let description = descriptionElement
              ? descriptionElement.textContent.trim()
              : null;
  
            articles.push({
              title: title || "No title",
              date: date || "No date",
              autore: autore || "No author",
              img: img || "No image",
              link: link || "No link",
              description: description || "No description",
            });
          });
        return articles;
      })
      .catch((err) => {
        console.error("Error in page.evaluate:", err);
        return [];
      });
  
    return pageData;
  }
  

  // Scrape the given URL
  articlesData = await scrapePage(url);

  // Log the collected articles data
  console.log("Scraped Articles Data:", articlesData);

  // Uncomment these lines to save the data to a JSON file
    fs.writeFileSync(
      "forbesAssets.json",
      JSON.stringify(articlesData, null, 2),
      "utf-8"
    );
  console.log("Data has been saved to forbesAssets.json");

  //   await browser.close();
}

scrapeAllPages();
