const CronJob = require('cron').CronJob;
const CronTime = require('cron').CronTime;
const got = require('got');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const crypto = require('crypto');
const fs = require('fs-extra');

const file = './sites.json';            // JSON file to store monitored sites
const settingsFile = './settings.json'; // JSON file to store cron settings

let sitesToMonitor = [];                // List of sites to monitor
let cronTime = { interval: 5 };          // Default interval for checking updates

// Load saved sites and settings
function loadSettings() {
  if (fs.existsSync(file)) {
    sitesToMonitor = fs.readJSONSync(file);
    console.log("Loaded sites:", sitesToMonitor);
  }

  if (fs.existsSync(settingsFile)) {
    cronTime = fs.readJSONSync(settingsFile);
    console.log("Loaded settings:", cronTime);
  }
}

// Save the sites and settings to JSON files
function saveSettings() {
  fs.outputJSON(file, sitesToMonitor, { spaces: 2 }, err => {
    if (err) console.log("Error saving sites:", err);
  });
  
  fs.outputJSON(settingsFile, cronTime, { spaces: 2 }, err => {
    if (err) console.log("Error saving settings:", err);
  });
}

// Update the sites by checking for changes in their content
function updateSites() {
  console.log("Starting site update...");

  for (const site of sitesToMonitor) {
    got(site.url).then(response => {
      // Parse site content using JSDOM
      const dom = new JSDOM(response.body);
      let content = dom.window.document.querySelector(site.css || 'head').textContent;
      
      // Generate a hash of the content
      let hash = crypto.createHash('md5').update(content).digest('hex');
      
      // Check if the content has changed
      if (site.hash !== hash) {
        console.log(`🔎 ${site.id} has changed!`);
        console.log(`Previous update: ${site.lastUpdated}`);
        
        // Update site metadata
        let currentTime = new Date().toLocaleString();
        site.lastUpdated = currentTime;
        site.hash = hash;

        // Save updated sites
        saveSettings();
      }

      // Update the lastChecked timestamp
      site.lastChecked = new Date().toLocaleString();
      
    }).catch(err => {
      console.error(`Error fetching ${site.url}:`, err);
    });
  }

  console.log("Site update complete.");
}

// Set up the cron job
const cronUpdate = new CronJob(`0 */${cronTime.interval} * * * *`, function () {
  console.log(`Cron job running every ${cronTime.interval} minute(s)...`);
  updateSites();
}, null, false);

// Start monitoring sites based on interval
function startMonitoring() {
  cronUpdate.setTime(new CronTime(`0 */${cronTime.interval} * * * *`));
  cronUpdate.start();
  console.log(`Monitoring started with an interval of ${cronTime.interval} minute(s).`);
}

// Add a new site to monitor
function addSite(url, css = 'head') {
  const site = {
    id: url.split('/')[2],
    url: url,
    css: css,
    lastChecked: new Date().toLocaleString(),
    lastUpdated: new Date().toLocaleString(),
    hash: ''
  };

  // Initial fetch to generate hash
  got(url).then(response => {
    const dom = new JSDOM(response.body);
    let content = dom.window.document.querySelector(css).textContent;
    site.hash = crypto.createHash('md5').update(content).digest('hex');
    sitesToMonitor.push(site);
    saveSettings();
    console.log(`Site added: ${site.url} with CSS selector: ${site.css}`);
  }).catch(err => {
    console.error(`Error adding site: ${url}.`, err);
  });
}

// Remove a site from monitoring
function removeSite(index) {
  if (index >= 0 && index < sitesToMonitor.length) {
    console.log(`Removing site: ${sitesToMonitor[index].url}`);
    sitesToMonitor.splice(index, 1);
    saveSettings();
  } else {
    console.log("Invalid index. Please provide a valid site index to remove.");
  }
}

// List all sites being monitored
function listSites() {
  console.log("Current sites being monitored:");
  sitesToMonitor.forEach((site, index) => {
    console.log(`${index + 1}. ${site.url} (CSS Selector: ${site.css}, Last Updated: ${site.lastUpdated})`);
  });
}

// Initialize script by loading settings and starting monitoring
loadSettings();
startMonitoring();

// Example usage:
// addSite('https://example.com', 'body'); // Add a new site to monitor
// removeSite(0);                          // Remove site at index 0
// listSites();                            // List all monitored sites
