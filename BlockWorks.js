const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Delay function to simulate waiting
async function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  // Function to perform infinite scroll
  async function infiniteScroll(page) {
    let previousHeight;
    try {
      while (true) {
        previousHeight = await page.evaluate(() => document.body.scrollHeight);
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight)
        );
        await timeout(3000); // Wait for data to load (adjust as needed)

        const newHeight = await page.evaluate(() => document.body.scrollHeight);
        if (newHeight === previousHeight) {
          console.log("Reached end of page");
          break;
        }
        console.log("Scrolled down, new content loaded");
      }
    } catch (e) {
      console.error("Error during infinite scroll:", e);
    }
  }

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to the website
  await page.goto("https://blockworks.co/news", {
    waitUntil: "networkidle2", // Ensure the network is idle before continuing
  });

  // Perform infinite scroll to load all content
  await infiniteScroll(page);

  console.log("Scrolling completed. Starting data extraction...");

  // Extract content after all scrolling is done
  const content = await page.evaluate(() => {
    let data = [];
    const articles = document.querySelectorAll(
      "main > section:nth-child(2) > div.flex > div.grid > div"
    );

    if (articles.length === 0) {
      console.log("No articles found");
      return data; // Return empty data if nothing found
    }

    articles.forEach((e) => {
      const image =
        e.querySelector("div > div:nth-child(1) > a > div > img")?.src ||
        "No image available";

      const category =
        e
          .querySelector("div > div:nth-child(2) > div > p")
          ?.textContent.trim() || "No category";

      const title =
        e
          .querySelector("div > div:nth-child(2) > div:nth-child(2) > a")
          ?.textContent.trim() || "No title";

      const link =
        e.querySelector("div > div:nth-child(2) > div:nth-child(2) > a")
          ?.href || "No link";

      const description =
        e
          .querySelector("div > div:nth-child(2) > div:nth-child(3) > p")
          ?.textContent.trim() || "No description";

      const author =
        e
          .querySelector(
            "div > div:nth-child(2) > div > div > span:nth-child(1) > a"
          )
          ?.textContent.trim() || "No author";

      const date =
        e
          .querySelector("div > div:nth-child(2) > div > div > time")
          ?.textContent.trim() || "No date";

      data.push({
        id: Math.floor(Math.random() * 1500),
        image,
        link,
        category,
        title,
        description,
        author,
        date,
      });
      console.log("data", data);
    });
    return data;
  });

  // Save the extracted data to a file
  if (content.length > 0) {
    fs.writeFileSync(
      "BlockWorks.json",
      JSON.stringify(content, null, 2),
      "utf-8"
    );
    console.log("Data successfully saved to BlockWorks.json");
  } else {
    console.log("No data extracted.");
  }

  await browser.close();
})();