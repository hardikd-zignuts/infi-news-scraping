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
  const url = "https://aimagazine.com/articles";
  let articlesData = [];

  async function scrapePage(url) {
    await page.goto(url, { timeout: 0 });
    let originalOffset = 0;
    let count = 0;
    let noChangeCount = 0; // Track if the scroll offset hasn't changed

    // Initial scroll to the bottom to find the "Load More" button
    while (true) {
      await page.evaluate("window.scrollBy(0, document.body.scrollHeight)");
      let newOffset = await page.evaluate("window.pageYOffset");
      if (originalOffset === newOffset) {
        break;
      }
      originalOffset = newOffset;
    }

    // Check if the "Load More" button exists and click it
    let hrefElement = await page.$(
      "#content > div > div > div:nth-child(4) > div > div > div > div > div > div:nth-child(2) > div.TextAlign_center__oSmar > button"
    );

    if (hrefElement) {
      await delay(1000);
      await page.waitForSelector(
        "#content > div > div > div:nth-child(4) > div > div > div > div > div > div:nth-child(2) > div.TextAlign_center__oSmar > button",
        { visible: true }
      );

      // Click the button
      await page.click(
        "#content > div > div > div:nth-child(4) > div > div > div > div > div > div:nth-child(2) > div.TextAlign_center__oSmar > button"
      );
    }

    // After clicking, continue scrolling until 100 counts are reached
    originalOffset = 0;
    while (count < 100) {
      await delay(2000); // Add longer delay to allow content to load
      count++;
      console.log("Scroll count: ", count);

      // Scroll to the bottom
      await page.evaluate("window.scrollBy(0, document.body.scrollHeight)");
      let newOffset = await page.evaluate("window.pageYOffset");

      // Check if scrolling actually loaded new content
      if (originalOffset === newOffset) {
        noChangeCount++;
        if (noChangeCount >= 3) {
          console.log("No more new content after 3 attempts, stopping.");
          break; // Stop if no new content is loaded after 3 attempts
        }
      } else {
        noChangeCount = 0; // Reset the counter if new content was loaded
      }

      originalOffset = newOffset;

      // If count reaches 100, stop
      if (count >= 100) break;
    }

    // Extract articles data from the list page
    let pageData = await page
      .evaluate(() => {
        let articles = [];
        console.log("Scraping articles...");

        document
          .querySelectorAll(
            ".infinite-scroll-component__outerdiv>.infinite-scroll-component>div>div"
          )
          .forEach((article) => {
            let linkElement = article.querySelector(
              ".Card_CardOverlayLink__2VHuB"
            );
            let imgElement = article.querySelector(
              ".Card_CardImageInner__1oL7C img"
            );
            let titleElement = article.querySelector(
              ".Card_CardTitle__2iv6a h3"
            );
            let descriptionElement = article.querySelector(
              ".Card_CardDescription__24Xbo p"
            );

            let link = linkElement
              ? linkElement.getAttribute("href")
              : "No link";
            let img = imgElement ? imgElement.getAttribute("src") : "No image";
            let title = titleElement
              ? titleElement.textContent.trim()
              : "No title";
            let description = descriptionElement
              ? descriptionElement.textContent.trim()
              : "No description";

            articles.push({
              title: title,
              img: img,
              link: link,
              description: description,
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

//   Uncomment these lines to save the data to a JSON file
    fs.writeFileSync(
      "aimagazine.json",
      JSON.stringify(articlesData, null, 2),
      "utf-8"
    );
    console.log("Data has been saved to mitNews.json");

    await browser.close();
}

scrapeAllPages();
