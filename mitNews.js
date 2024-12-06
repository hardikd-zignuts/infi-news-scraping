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
  const url = "https://news.mit.edu/";
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
      ".front-page--recent-news--content--load-more--button"
    );

    let count = 0;

    while (hrefElement) {
      await delay(1000);
      count++;
      console.log("count: ", count);
      // Wait for the button to be clickable
      await page.waitForSelector(
        ".front-page--recent-news--content--load-more--button",
        { visible: true }
      );

      // Click the button
      await page.click(".front-page--recent-news--content--load-more--button");

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
        ".front-page--recent-news--content--load-more--button"
      );

      if (count > 100) break;

      if (!hrefElement) break;
    }
    // Extract articles data from the list page
    let pageData = await page
      .evaluate(() => {
        let articles = [];
        console.log("object");
        document
          .querySelectorAll(
            "#recent-news>.front-page--section-content>.front-page--section-content--row>.front-page--section-content--list-item>article"
          )
          .forEach((article) => {
            let linkElement = article.querySelector(
              ".front-page--news-article--teaser--cover-image>a"
            );
            let imgElement = article.querySelector(
              ".front-page--news-article--teaser--cover-image>a>img"
            );

            let titleElement = article.querySelector(
              ".front-page--news-article--teaser--descr>.front-page--news-article--teaser--title>a"
            );

            let descriptionElement = article.querySelector(
              ".front-page--news-article--teaser--descr>.front-page--news-article--teaser--dek"
            );

            let link = linkElement ? linkElement.getAttribute("href") : null;
            let img = imgElement ? imgElement.getAttribute("src") : null;
            let title = titleElement ? titleElement.textContent.trim() : null;
            let description = descriptionElement
              ? descriptionElement.textContent.trim()
              : null;

            articles.push({
              title: title || "No title",
              img: `https://news.mit.edu/${img}` || "No image",
              link: link ? `https://news.mit.edu/${link}` : "No link",
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
    "mitNews.json",
    JSON.stringify(articlesData, null, 2),
    "utf-8"
  );
  console.log("Data has been saved to mitNews.json");

  await browser.close();
}

scrapeAllPages();
