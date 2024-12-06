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
  const url = "https://www.coindesk.com/livewire/";
  let articlesData = [];

  async function scrapePage(url) {
    await page.goto(url, { timeout: 0 });
    let originalOffset = 0;
    await page.click("#CybotCookiebotDialogBodyButtonAccept")
    await delay(2000);
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
      "button.button__Button-sc-uwgksy-0.button__ActionButtonStyle-sc-uwgksy-1"
    );

    let count = 0;

    while (hrefElement) {
      await delay(1000);
      count++;
      console.log("count: ", count);
      // Wait for the button to be clickable
      await page.waitForSelector(
        "button.button__Button-sc-uwgksy-0.button__ActionButtonStyle-sc-uwgksy-1",
        { visible: true }
      );

      // Click the button
      await page.click(
        "button.button__Button-sc-uwgksy-0.button__ActionButtonStyle-sc-uwgksy-1"
      );

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
        "button.button__Button-sc-uwgksy-0.button__ActionButtonStyle-sc-uwgksy-1"
      );

      if (count > 3) break;

      if (!hrefElement) break;
    }
    // Extract articles data from the list page
    let pageData = await page
      .evaluate(() => {
        let articles = [];
        document.querySelectorAll(".side-cover-card").forEach((article) => {
          let linkElement = article.querySelector("[class^='card-imagestyles__CardImageWrapper-sc']");
          let imgElement = article.querySelector(
            "div:nth-child(1)>a>picture>img"
          );

          let titleElement = article.querySelector(
            "div:nth-child(2)>.card-title-link>.card-title>h4"
          );
          let categoryElement = article.querySelector(
            "div:nth-child(2)>div:nth-child(1)>span"
          );

          let descriptionElement = article.querySelector(
            "[class^='card-descriptionstyles__CardDescriptionWrapper-sc']>p"
          );

          let dateElement = article.querySelector(
            "[class^='card-datestyles__CardDateWrapper-sc']>span"
          );

          let link = linkElement ? linkElement.getAttribute("href") : null;
          let img = imgElement ? imgElement.getAttribute("src") : null;
          let title = titleElement ? titleElement.textContent.trim() : null;
          let category = categoryElement
            ? categoryElement.textContent.trim()
            : null;
          let date = dateElement ? dateElement.textContent.trim() : null;

          let description = descriptionElement
            ? descriptionElement.textContent.trim()
            : null;

          articles.push({
            title: title || "No title",
            img: img || "No image",
            link: link ? `https://www.coindesk.com${link}`  : "No link",
            category: category ? category : "No category",
            date: date ? date : "No date",
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
    "coinDesk.json",
    JSON.stringify(articlesData, null, 2),
    "utf-8"
  );
  console.log("Data has been saved to mitNews.json");

  await browser.close();
}

scrapeAllPages();
