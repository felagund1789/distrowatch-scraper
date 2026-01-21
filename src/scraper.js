/**
 * Web scraping module for DistroWatch
 */

const axios = require('axios');
const cheerio = require('cheerio');
const config = require('./config');

/**
 * Fetch HTML content from URL with retry logic
 */
async function fetchHTML(url, retryCount = 0) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": config.USER_AGENT
      },
      timeout: config.TIMEOUT
    });
    return response.data;
  } catch (error) {
    if (retryCount < config.MAX_RETRIES) {
      console.log(`⚠️  HTTP request failed, retrying (${retryCount + 1}/${config.MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return fetchHTML(url, retryCount + 1);
    } else {
      console.error(`❌ Failed to fetch ${url} after ${config.MAX_RETRIES} retries:`, error.message);
      throw error;
    }
  }
}

/**
 * Parse distribution information from HTML metadata list
 */
function parseInfoTable($) {
  const info = {};

  // Parse the structure: <ul><li><b>Key:</b> Value</li></ul>
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

/**
 * Extract description from distribution page
 */
function extractDescription($) {
  const $tablesTitle = $("td.TablesTitle");
  const fullText = $tablesTitle.text();
  
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
  
  return descMatch ? descMatch[1].trim().replace(/\s+/g, ' ') : '';
}

/**
 * Extract homepage URL from Info table
 */
function extractHomepage($) {
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
  
  return homepage;
}

/**
 * Extract popularity and rating information
 */
function extractPopularityAndRating($) {
  const popularityText = $("td.TablesTitle").text();
  
  // Extract popularity ranking with multiple fallback patterns
  let popularityMatch = popularityText.match(/Popularity[\s\S]*?12 months:\s*<b>(\d+)<\/b>/);
  if (!popularityMatch) {
    popularityMatch = popularityText.match(/Popularity[\s\S]*?12 months:\s*\*\*(\d+)\*\*/);
  }
  if (!popularityMatch) {
    popularityMatch = popularityText.match(/Popularity[\s\S]*?12 months:\s*(\d+)/);
  }
  const popularity = popularityMatch ? parseInt(popularityMatch[1]) : null;

  // Extract rating with multiple fallback patterns
  let ratingMatch = popularityText.match(/Average visitor rating[\s\S]*?<b>([\d.]+)<\/b>\/10 from <b>(\d+)<\/b>/);
  if (!ratingMatch) {
    ratingMatch = popularityText.match(/Average visitor rating[\s\S]*?\*\*([\d.]+)\*\*\/10 from \*\*(\d+)\*\*/);
  }
  if (!ratingMatch) {
    ratingMatch = popularityText.match(/Average visitor rating[\s\S]*?([\d.]+)\/10 from (\d+)/);
  }
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
  const reviewCount = ratingMatch ? parseInt(ratingMatch[2]) : null;
  
  return { popularity, rating, reviewCount };
}

/**
 * Fetch all distribution slugs from DistroWatch popularity page with retry logic
 */
async function fetchAllDistroSlugs(retryCount = 0) {
  try {
    console.log("Fetching distro index...");
    const html = await fetchHTML(config.INDEX_URL);
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
  } catch (error) {
    if (retryCount < config.MAX_RETRIES) {
      console.log(`⚠️  Failed to fetch distribution list, retrying (${retryCount + 1}/${config.MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return fetchAllDistroSlugs(retryCount + 1);
    } else {
      console.error(`❌ Failed to fetch distribution list after ${config.MAX_RETRIES} retries:`, error.message);
      throw error;
    }
  }
}

/**
 * Scrape detailed information for a specific distribution with retry logic
 */
async function scrapeDistro(slug, retryCount = 0) {
  try {
    return await scrapeDistroInternal(slug);
  } catch (error) {
    if (retryCount < config.MAX_RETRIES) {
      console.log(`⚠️  Scraping failed for ${slug}, retrying (${retryCount + 1}/${config.MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return scrapeDistro(slug, retryCount + 1);
    } else {
      console.error(`❌ Failed to scrape ${slug} after ${config.MAX_RETRIES} retries:`, error.message);
      throw error;
    }
  }
}

/**
 * Internal scraping function that does the actual work
 */
async function scrapeDistroInternal(slug) {
  const url = `${config.DISTRO_URL}${slug}`;
  console.log(`Scraping ${slug}`);

  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  // Extract name from h1 tag
  const name = $("td.TablesTitle h1").text().trim() || slug;
  
  // Extract last update from h2 tag
  const lastUpdateText = $("td.TablesTitle h2").text().trim();
  const lastUpdate = lastUpdateText.replace('Last Update: ', '').replace(' UTC', '') || null;

  // Extract description
  const description = extractDescription($);

  // Parse structured metadata
  const info = parseInfoTable($);

  // Extract homepage
  const homepage = extractHomepage($);

  // Extract logo (class="logo")
  const $logo = $("td.TablesTitle img.logo");
  const logoSrc = $logo.attr("src");
  const logo = logoSrc ? (logoSrc.startsWith('http') ? logoSrc : `https://distrowatch.com/${logoSrc}`) : null;

  // Extract thumbnail (right-aligned image with style width)
  const $thumbnail = $("td.TablesTitle img[align='right'][style*='width']");
  const thumbnailSrc = $thumbnail.attr("src");
  const thumbnail = thumbnailSrc ? (thumbnailSrc.startsWith('http') ? thumbnailSrc : `https://distrowatch.com/${thumbnailSrc}`) : null;
  
  // Extract large screenshot URL from the link
  const screenshotLink = $("td.TablesTitle a[href*='images/'][href*='.png'] img").parent().attr('href');
  const screenshot = screenshotLink ? (screenshotLink.startsWith('http') ? screenshotLink : `https://distrowatch.com/${screenshotLink}`) : null;
  // Extract popularity and rating
  const { popularity, rating, reviewCount } = extractPopularityAndRating($);

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
    thumbnail,
    screenshot
  };
}

module.exports = {
  fetchAllDistroSlugs,
  scrapeDistro
};