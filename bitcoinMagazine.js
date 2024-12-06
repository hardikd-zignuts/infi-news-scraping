const puppeteer = require("puppeteer");
const fs = require("fs"); // Import fs package

async function scrapeAllPages() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const url = "https://bitcoinmagazine.com/";
  let articlesData = [];

  // Function to scrape a single page
  async function scrapePage(url) {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
    // await page.waitForSelector(".l-grid--item")
    // Extract articles data from the list page
    let pageData = await page.evaluate(() => {
      let articles = [];
      document.querySelectorAll(".l-grid--item").forEach((article) => {
        let linkElement = article.querySelector("phoenix-super-link");
       
        let imgElement = article.querySelector(
          "phoenix-card .m-card--media .m-card--image-link phoenix-picture picture .m-card--image-element"
        );
      
        let titleElement = article.querySelector(
          "phoenix-card .m-card--content .m-card--header a .m-card--header-text"
        );
       
        let descriptionElement = article.querySelector(
          "phoenix-card .m-card--content .m-card--body-container .m-ellipsis--text"
        );
       
        let authorElement = article.querySelector(
          "phoenix-card .m-card--content .m-card--metadata .m-card--metadata-a .m-card--metadata-slot .m-card--metadata-b-link"
        );

        let dateElement = article.querySelector(
          "phoenix-card .m-card--content .m-card--metadata .m-card--metadata-a .m-card--metadata-slot .m-card--metadata-text phoenix-timeago time"
        );
   
        let tagsElement = article.querySelector(
          "phoenix-card .m-card--content .m-card--stamp .m-section-label a .m-stamp--text"
        );
   
        let link = linkElement ? linkElement.getAttribute("href") : null;
        let img = imgElement ? imgElement.getAttribute("src") : null;
        let title = titleElement ? titleElement.textContent.trim() : null;
        let description = descriptionElement ? descriptionElement.textContent.trim() : null;
        let author = authorElement ? authorElement.textContent.trim() : null;
        let date = dateElement ? dateElement.getAttribute("datetime") : null;
        let tags = tagsElement ? tagsElement.textContent.trim() : null;

        articles.push({
          title: title || "No title",
          img: img || "No image",
          link: link ? `https://bitcoinmagazine.com${link}` : "No link",
          description: description || "No description",
          author: author || "No author",
          date: date || "No date",
          tags: tags || "No tags",
        });
      });
      return articles;
    }).catch((err) => {
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
  fs.writeFileSync('bitcoinMagazineArticles.json', JSON.stringify(articlesData, null, 2), 'utf-8');
  console.log("Data has been saved to bitcoinMagazineArticles.json");

  await browser.close();
}

scrapeAllPages();
