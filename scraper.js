const axios = require("axios");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");

async function scrapeWebsite(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const bodyText = $("body").text().toLowerCase();

    if (bodyText.includes("cve") || bodyText.includes("Vulnerability")) {
      const title = $("title").text();
      const relevantParagraphs = $("p")
        .filter((i, el) => {
          const text = $(el).text().toLowerCase();
          return text.includes("cve") || text.includes("Vulnerability");
        })
        .map((i, el) => $(el).text())
        .get();

      return {
        title,
        relevantParagraphs,
        url,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

module.exports = { scrapeWebsite };
