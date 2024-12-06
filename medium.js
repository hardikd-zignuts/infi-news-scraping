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
  const url = "https://medium.com/security-token-group";
  let articlesData = [];

  async function scrapePage(url) {
    await page.goto(url, { timeout: 0 });

    // Extract articles data from the list page
    let pageData = await page.evaluate(() => {
      let articles = [];
      document
        .querySelectorAll(".js-trackPostPresentation")
        .forEach((article) => {
          let linkElement = article.querySelector(".u-lineHeightBase>a");
          let dateElement = article.querySelector("time");
          let descriptionElement = article.querySelector(
            ".u-letterSpacingTight"
          );
          let titleElement = article.querySelector(
            ".u-xs-marginBottom10>a>h3>div"
          );
          let backgroundImageElement = article.querySelector(
            'a[data-action="open-post"]'
          );
          let backgroundImage = backgroundImageElement
            ? window.getComputedStyle(backgroundImageElement).backgroundImage
            : null;

          let link = linkElement ? linkElement.getAttribute("href") : null;
          let title = titleElement ? titleElement.textContent.trim() : null;
          let date = dateElement ? dateElement.textContent.trim() : null;
          let description = descriptionElement
            ? descriptionElement.textContent.trim()
            : null;

          articles.push({
            title: title || "No title",
            date: date || "No date",
            description: description || "No description",
            img: backgroundImage || "No image",
            link: link || "No link",
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
  //   fs.writeFileSync("medium.json", JSON.stringify(articlesData, null, 2), "utf-8");
  //   console.log("Data has been saved to medium.json");

  // Close the browser
  // await browser.close();
}

scrapeAllPages();
