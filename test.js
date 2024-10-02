const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const crypto = require("crypto");

// Load URLs from the JSON file
function loadURLs(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data).map((item) => Object.values(item)[0]); // Extract the first URL from each object
  } else {
    throw new Error("URL file does not exist");
  }
}

puppeteer.use(StealthPlugin());

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const urls = loadURLs("urls.json"); // Load URLs from the file

    for (const url of urls) {
      console.log(`Processing URL: ${url}`);
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle2" });

      // Extract all hyperlinks and convert them to absolute URLs
      const hyperlinks = await page.evaluate(() => {
        const links = [];
        document.querySelectorAll("a").forEach((anchor) => {
          const href = anchor.getAttribute("href");
          if (href && href !== "#") {
            // Convert relative URLs to absolute URLs
            const absoluteURL = new URL(href, document.baseURI).href;
            links.push(absoluteURL);
          }
        });
        return links;
      });

      // Remove duplicate links by using a Set
      const uniqueLinks = [...new Set(hyperlinks)];

      // Filter links to include only those from the same domain
      const domainFilteredLinks = uniqueLinks.filter((link) =>
        link.startsWith(
          "", //"url")
        ),
      );

      // Print the filtered and unique hyperlinks
      console.log("Filtered Hyperlinks:", domainFilteredLinks);

      // Create a hash for each link
      const linkHashes = domainFilteredLinks.map((link) =>
        crypto.createHash("md5").update(link).digest("hex"),
      );

      // Save the hashed links to a file (as JSON for easy reading)
      const hashFilePath = "link_hashes.json";

      // Read the previous hashes from the file (if it exists)
      let previousHashes = [];
      if (fs.existsSync(hashFilePath)) {
        previousHashes = JSON.parse(fs.readFileSync(hashFilePath, "utf8"));
      }

      // Identify newly added links by comparing hashes
      const newHashes = linkHashes.filter(
        (hash) => !previousHashes.includes(hash),
      );

      if (newHashes.length > 0) {
        console.log(`New links added: ${newHashes.length}`);
        // Find and print the newly added links
        const newLinks = domainFilteredLinks.filter((link) => {
          const linkHash = crypto.createHash("md5").update(link).digest("hex");
          return newHashes.includes(linkHash);
        });
        console.log("Newly Added Links:", newLinks);
      } else {
        console.log("No new links added.");
      }

      // Save the current hashes to the file for future comparison
      fs.writeFileSync(
        hashFilePath,
        JSON.stringify(linkHashes, null, 2),
        "utf8",
      );
      console.log(`Hashes saved to ${hashFilePath}`);

      await page.close(); // Close the page after processing
    }

    await browser.close(); // Close the browser
  } catch (error) {
    console.error(`Error fetching content: ${error.message}`);
  }
})();
