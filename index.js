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
const LOGOS_DIR = path.join(IMAGE_DIR, "logos");
const THUMBNAILS_DIR = path.join(IMAGE_DIR, "thumbnails");
const SCREENSHOTS_DIR = path.join(IMAGE_DIR, "screenshots");

// Create image directories if they don't exist
[IMAGE_DIR, LOGOS_DIR, THUMBNAILS_DIR, SCREENSHOTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Simple delay to avoid hammering the site
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Download an image from URL and save to local file
 */
async function downloadImage(url, filepath) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        "User-Agent": USER_AGENT
      },
      timeout: TIMEOUT
    });
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, response.data);
    console.log(`📸 Downloaded: ${path.basename(filepath)}`);
    return filepath;
  } catch (error) {
    console.error(`❌ Failed to download ${url}:`, error.message);
    return null;
  }
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

  // Parse the new structure: <ul><li><b>Key:</b> Value</li></ul>
  $("td.TablesTitle ul li").each((_, item) => {
    const text = $(item).text().trim();
    const html = $(item).html();
    
    // Look for pattern: <b>Key:</b> Value
    const match = text.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      
      // Extract just the text content from links, removing extra whitespace
      const $temp = cheerio.load(`<div>${html}</div>`);
      const cleanValue = $temp('div').text().replace(/^[^:]+:\s*/, '').trim();
      
      if (key && cleanValue) {
        info[key] = cleanValue;
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

  // Extract name from h1 tag
  const name = $("td.TablesTitle h1").text().trim() || slug;
  
  // Extract last update from h2 tag
  const lastUpdateText = $("td.TablesTitle h2").text().trim();
  const lastUpdate = lastUpdateText.replace('Last Update: ', '').replace(' UTC', '') || null;

  // Extract description (text content after the </ul> and before popularity stats)
  const $tablesTitle = $("td.TablesTitle");
  let description = '';
  
  // Get description from the main text content
  const fullText = $tablesTitle.text();
  
  // Look for description pattern: after the metadata list and before popularity stats
  // Try multiple patterns to catch different description styles
  let descMatch = null;
  
  // Pattern 1: Text that starts after "Status: Active" and before "Popularity"
  descMatch = fullText.match(/Status:\s*[^\n]*[\n\s]+([\s\S]*?)(?=Popularity \(hits per day\)|Average visitor rating|$)/);
  
  // Pattern 2: If no status, look for text after last metadata item and before popularity
  if (!descMatch) {
    descMatch = fullText.match(/\n\s*((?:[A-Z][^.!?]*[.!?]\s*){1,}[\s\S]*?)(?=Popularity \(hits per day\)|Average visitor rating|$)/);
  }
  
  // Pattern 3: Fallback - look for any descriptive paragraph
  if (!descMatch) {
    descMatch = fullText.match(/([A-Z][^.!?]*(?:[.!?][^.!?]*){2,}[.!?])/);
  }
  
  description = descMatch ? descMatch[1].trim().replace(/\s+/g, ' ') : '';

  // Parse structured metadata
  const info = parseInfoTable($);

  // Extract homepage URL from Info table
  let homepage = null;
  $("table.Info tr").each((_, row) => {
    const headerCell = $(row).find("th.Info");
    const dataCell = $(row).find("td.Info");
    
    if (headerCell.text().trim() === "Home Page" && dataCell.length > 0) {
      const link = dataCell.find("a").first();
      if (link.length > 0) {
        homepage = link.attr("href");
      }
    }
  });

  // Extract logo (class="logo")
  const $logo = $("td.TablesTitle img.logo");
  const logoSrc = $logo.attr("src");
  const logo = logoSrc ? (logoSrc.startsWith('http') ? logoSrc : `https://distrowatch.com/${logoSrc}`) : null;

  // Extract screenshot (right-aligned image with style width)
  const $screenshot = $("td.TablesTitle img[align='right'][style*='width']");
  const screenshotSrc = $screenshot.attr("src");
  const screenshot = screenshotSrc ? (screenshotSrc.startsWith('http') ? screenshotSrc : `https://distrowatch.com/${screenshotSrc}`) : null;
  
  // Extract large screenshot URL from the link
  const screenshotLink = $("td.TablesTitle a[href*='images/'][href*='.png'] img").parent().attr('href');
  const largeScreenshot = screenshotLink ? (screenshotLink.startsWith('http') ? screenshotLink : `https://distrowatch.com/${screenshotLink}`) : null;

  // Extract popularity ranking
  const popularityText = $("td.TablesTitle").text();
  
  // Try multiple patterns for popularity extraction
  let popularityMatch = popularityText.match(/Popularity[\s\S]*?12 months:\s*<b>(\d+)<\/b>/);
  if (!popularityMatch) {
    popularityMatch = popularityText.match(/Popularity[\s\S]*?12 months:\s*\*\*(\d+)\*\*/);
  }
  if (!popularityMatch) {
    popularityMatch = popularityText.match(/Popularity[\s\S]*?12 months:\s*(\d+)/);
  }
  const popularity = popularityMatch ? parseInt(popularityMatch[1]) : null;

  // Extract rating - try multiple patterns
  let ratingMatch = popularityText.match(/Average visitor rating[\s\S]*?<b>([\d.]+)<\/b>\/10 from <b>(\d+)<\/b>/);
  if (!ratingMatch) {
    ratingMatch = popularityText.match(/Average visitor rating[\s\S]*?\*\*([\d.]+)\*\*\/10 from \*\*(\d+)\*\*/);
  }
  if (!ratingMatch) {
    ratingMatch = popularityText.match(/Average visitor rating[\s\S]*?([\d.]+)\/10 from (\d+)/);
  }
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
  const reviewCount = ratingMatch ? parseInt(ratingMatch[2]) : null;

  return {
    slug,
    name,
    lastUpdate,
    description,
    homepage,
    osType: info["OS Type"] || null,
    basedOn: info["Based on"] || null,
    origin: info["Origin"] || null,
    architecture: info["Architecture"] || null,
    desktop: info["Desktop"] || null,
    category: info["Category"] || null,
    status: info["Status"] || null,
    popularity,
    rating,
    reviewCount,
    logo,
    screenshot,
    largeScreenshot
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
        console.log(`\n🔍 Processing ${distro}...`);
        const data = await scrapeDistro(distro);
        
        // Download images if URLs are available
        const downloadedPaths = {
          logo: null,
          screenshot: null,
          largeScreenshot: null
        };
        
        // Download logo
        if (data.logo) {
          const logoExt = path.extname(new URL(data.logo).pathname) || '.png';
          const logoPath = path.join(LOGOS_DIR, `${distro}${logoExt}`);
          downloadedPaths.logo = await downloadImage(data.logo, logoPath);
        }
        
        // Download small screenshot
        if (data.screenshot) {
          const screenshotExt = path.extname(new URL(data.screenshot).pathname) || '.png';
          const screenshotPath = path.join(THUMBNAILS_DIR, `${distro}${screenshotExt}`);
          downloadedPaths.screenshot = await downloadImage(data.screenshot, screenshotPath);
        }
        
        // Download large screenshot
        if (data.largeScreenshot) {
          const largeExt = path.extname(new URL(data.largeScreenshot).pathname) || '.png';
          const largePath = path.join(SCREENSHOTS_DIR, `${distro}${largeExt}`);
          downloadedPaths.largeScreenshot = await downloadImage(data.largeScreenshot, largePath);
        }
        
        // Update data with local file paths
        data.localPaths = downloadedPaths;
        
        results.push(data);
        console.log(`✅ Scraped and downloaded images for ${distro}`);
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