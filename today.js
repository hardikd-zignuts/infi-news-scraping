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
  const url = "https://u.today/";
  let articlesData = [];

  async function scrapePage(url) {
    await page.goto(url, { timeout: 0 });
    let originalOffset = 0;
    while (true) {
      await page.evaluate("window.scrollBy(0, document.body.scrollHeight)");
      let newOffset = await page.evaluate("window.pageYOffset");
      if (originalOffset === newOffset) {
        break;
      }
      originalOffset = newOffset;
    }
    // Wait for the "Load More" button to appear
    let hrefElement = await page.$(
      "a[title='Load more items']"
    );

    let count = 0;

    while (hrefElement) {
      await delay(1000);
      count++;
      console.log("count: ", count);
      // Wait for the button to be clickable
      await page.waitForSelector(
        "a[title='Load more items']",
        { visible: true }
      );

      // Click the button
      await page.click("a[title='Load more items']");

      // Scroll again after clicking load more
      originalOffset = 0;
      while (true) {
        await page.evaluate("window.scrollBy(0, document.body.scrollHeight)");
        let newOffset = await page.evaluate("window.pageYOffset");
        if (originalOffset === newOffset) {
          break;
        }
        originalOffset = newOffset;
      }

      // Check if the load more button still exists after loading more articles
      hrefElement = await page.$(
        "a[title='Load more items']"
      );

      if (count > 1) break;

      if (!hrefElement) break;
    }
    // Extract articles data from the list page
    let pageData = await page
      .evaluate(() => {
        let articles = [];
        document.querySelectorAll(".news__item").forEach((article) => {
          console.log('article: ', article);
          let linkElement = article.querySelector(".news__item-body");
          let dateElement = article.querySelector(".news__item-head.humble__row > .humble");
          let imgElement = article.querySelector(".humble__img");
          let titleElement = article.querySelector(".news__item-title");
          let tagElement = article.querySelector(".news__item-tags > a");
          let authorElement = article.querySelector(".news__item-footer > a.humble--author");
        
          let link = linkElement ? linkElement.getAttribute("href") : null;
          let img = imgElement ? imgElement.getAttribute("src") : null;
          let title = titleElement ? titleElement.textContent.trim() : null;
          let date = dateElement ? dateElement.textContent.trim() : null;
          let tag = tagElement ? tagElement.textContent.trim() : null;
          let author = authorElement ? authorElement.textContent.trim() : null;
        
          articles.push({
            title: title || "No title",
            img: img || "No image",
            link: link || "No link",
            date: date || "No date",
            tag: tag || "No tag",
            author: author || "No author",
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
  // fs.writeFileSync(
  //   "today.json",
  //   JSON.stringify(articlesData, null, 2),
  //   "utf-8"
  // );
  // console.log("Data has been saved to mitNews.json");

  await browser.close();
}

scrapeAllPages();
