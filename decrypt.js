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
  const url = "https://decrypt.co/news";
  let articlesData = [];

  async function scrapePage(url) {
    await page.goto(url, { timeout: 0 });
    let originalOffset = 0;
    await page.click("#CybotCookiebotDialogBodyButtonAccept")
    while (true) {
      await page.evaluate("window.scrollBy(0, document.body.scrollHeight)");
      let newOffset = await page.evaluate("window.pageYOffset");
      if (originalOffset === newOffset) {
        break;
      }
      originalOffset = newOffset;
    }

    // // Wait for the "Load More" button to appear
    // let hrefElement = await page.$(".h-[48px].flex.justify-end>button");

    // let count = 0;

    // while (hrefElement) {
    //   await delay(1000);
    //   count++;
    //   console.log("count: ", count);
    //   // Wait for the button to be clickable
    //   await page.waitForSelector(
    //     ".h-[48px].flex.justify-end>button",
    //     { visible: true }
    //   );

    //   // Click the button
    //   await page.click(
    //     ".h-[48px].flex.justify-end>button"
    //   );

    //   // Scroll again after clicking load more
    //   originalOffset = 0;
    //   while (true) {
    //     await page.evaluate("window.scrollBy(0, document.body.scrollHeight)");
    //     let newOffset = await page.evaluate("window.pageYOffset");
    //     if (originalOffset === newOffset) {
    //       break;
    //     }
    //     originalOffset = newOffset;
    //   }

    //   // Check if the load more button still exists after loading more articles
    //   hrefElement = await page.$(
    //     ".h-[48px].flex.justify-end>button"
    //   );

    //   if (count > 2) break;

    //   if (!hrefElement) break;
    // }
    // Extract articles data from the list page
    let pageData = await page
      .evaluate(() => {
        let articles = [];
        console.log("object");
        document
          .querySelectorAll("#__next > div > div > div > div > main > div > div:nth-child(6) > div > article > article:nth-child(1)")
          .forEach((article) => {
            let linkElement = article.querySelector(".grow>h3>a");
            let imgElement = article.querySelector(".linkbox>img");
            let titleElement = article.querySelector(".grow>h3>a>span");
            let CategoryElement = article.querySelector(
              ".grow>.text-cc-pink-2"
            );
            let descriptionElement = article.querySelector(
              ".grow>.gg-dark:text-neutral-100"
            );
            let dateElement = article.querySelector("div>h4");

            let link = linkElement ? linkElement.getAttribute("href") : null;
            let img = imgElement ? imgElement.getAttribute("srcset") : null;
            let title = titleElement ? titleElement.textContent.trim() : null;
            let category = CategoryElement
              ? CategoryElement.textContent.trim()
              : null;
            let desciption = descriptionElement
              ? descriptionElement.textContent.trim()
              : null;
            let date = dateElement ? dateElement.textContent.trim() : null;

            articles.push({
              title: title || "No title",
              category: category || "No category",
              desciption: desciption || "No desciption",
              img: img || "No image",
              link: link ? `https://decrypt.co/${link}` : "No link",
              date: date || "No time",
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
  //   "bloomberg.json",
  //   JSON.stringify(articlesData, null, 2),
  //   "utf-8"
  // );
  console.log("Data has been saved to mitNews.json");

//   await browser.close();
}

scrapeAllPages();
