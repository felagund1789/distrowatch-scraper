#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

// Configuration from environment variables
const INDEX_URL = process.env.INDEX_URL || "https://distrowatch.com/dwres.php?resource=popularity";
const DISTRO_URL = process.env.DISTRO_URL || "https://distrowatch.com/table.php?distribution=";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "./data";
const OUTPUT_FILE = process.env.OUTPUT_FILE || "distros.json";
const REQUEST_DELAY = parseInt(process.env.REQUEST_DELAY) || 1000;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;
const TIMEOUT = parseInt(process.env.TIMEOUT) || 10000;
const USER_AGENT = process.env.USER_AGENT || "Mozilla/5.0 (DistroWatch Scraper)";
const IMAGE_DIR = path.join(OUTPUT_DIR, "images");

if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// Simple delay to avoid hammering the site
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchHTML(url) {
  const response = await axios.get(url, {
    headers: {
      "User-Agent": USER_AGENT
    },
    timeout: TIMEOUT
  });
  return response.data;
}

function parseInfoTable($) {
  const info = {};

  $("table.Info tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length === 2) {
      const key = $(cells[0]).text().trim();
      const value = $(cells[1]).text().trim();
      if (key && value) {
        info[key] = value;
      }
    }
  });

  return info;
}

async function fetchAllDistroSlugs() {
  console.log("Fetching distro index...");
  const html = await fetchHTML(INDEX_URL);
  const $ = cheerio.load(html);

  const slugs = new Set();

  // Parse distros from the ranking table rows
  // Template: <td class="phr2"><a title="Based on: Arch" href="archriot">Archriot</a></td>
  $("tr td.phr2 a[href]").each((_, link) => {
    const href = $(link).attr("href");
    const title = $(link).attr("title") || "";
    const name = $(link).text().trim();
    
    // Extract slug from href (should be just the distro name)
    if (href && href.length > 0 && !href.includes('http') && !href.includes('?')) {
      const slug = href.toLowerCase().trim();
      console.log(`Found distro: ${name} (${slug})${title ? ' - ' + title : ''}`);
      slugs.add(slug);
    }
  });

  const sortedSlugs = Array.from(slugs).sort();
  console.log(`📊 Found ${sortedSlugs.length} distributions`);
  return sortedSlugs;
}

async function scrapeDistro(slug) {
  const url = `${DISTRO_URL}${slug}`;
  console.log(`Scraping ${slug}`);

  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  // Description
  const description = $("td.TablesTitle")
    .first()
    .next("tr")
    .find("td")
    .text()
    .trim();

  // Structured metadata
  const info = parseInfoTable($);

  // Logo URL
  const logoSrc = $("img[src*='images/logo']").attr("src");
  const logo = logoSrc ? `https://distrowatch.com/${logoSrc}` : null;

  // Screenshot URL
  const screenshotSrc = $("img[src*='screenshots']").first().attr("src");
  const screenshot = screenshotSrc
    ? `https://distrowatch.com/${screenshotSrc}`
    : null;

  return {
    slug,
    name: info["Distribution"] || slug,
    description,
    country: info["Country"] || null,
    desktops: info["Desktop"] || null,
    architecture: info["Architecture"] || null,
    basedOn: info["Based on"] || null,
    packageManager: info["Package Manager"] || null,
    releaseModel: info["Release Model"] || null,
    status: info["Status"] || null,
    logo,
    screenshot
  };
}

/**
 * Main application entry point
 */
async function main() {
  try {
    console.log('🚀 Starting DistroWatch Scraper...');
    console.log('📦 Node.js version:', process.version);
    console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
    console.log('⏱️  Request delay:', REQUEST_DELAY + 'ms');
    console.log('📁 Output directory:', OUTPUT_DIR);
    
    // Create output directory if it doesn't exist
    await ensureOutputDir();
    
    console.log('✅ DistroWatch Scraper initialized successfully!');
    
    const distributions = await fetchAllDistroSlugs();
    console.log(`🎯 Ready to scrape ${distributions.length} distributions`);

    const results = [];
    for (const distro of distributions) {
      try {
        const data = await scrapeDistro(distro);
        results.push(data);
        console.log(`✅ Scraped ${distro}`);
        await sleep(REQUEST_DELAY);
      } catch (error) {
        console.error(`❌ Failed to scrape ${distro}:`, error.message);
      }
    }
    
    // Save results
    const outputPath = path.join(OUTPUT_DIR, OUTPUT_FILE);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`💾 Results saved to ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error starting application:', error.message);
    process.exit(1);
  }
}

/**
 * Ensure output directory exists
 */
async function ensureOutputDir() {
  try {
    await fs.promises.access(OUTPUT_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
      console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
    } else {
      console.log('❌ Error accessing output directory:', error.message);
      throw error;
    }
  }
}

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// Run the application if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { main };