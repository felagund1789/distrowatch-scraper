/**
 * Image download module
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ensureDirectoryExists } = require('./fileOperations');
const config = require('./config');

/**
 * Simple delay function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Download an image from URL and save to local file with retry logic
 */
async function downloadImage(url, filepath, retryCount = 0) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        "User-Agent": config.USER_AGENT
      },
      timeout: config.TIMEOUT
    });
    
    // Ensure directory exists
    ensureDirectoryExists(path.dirname(filepath));
    
    fs.writeFileSync(filepath, response.data);
    console.log(`📸 Downloaded: ${path.basename(filepath)}`);
    return filepath;
  } catch (error) {
    if (retryCount < config.MAX_RETRIES) {
      console.log(`⚠️  Download failed for ${path.basename(filepath)}, retrying (${retryCount + 1}/${config.MAX_RETRIES})...`);
      await sleep(1000 * (retryCount + 1)); // Exponential backoff
      return downloadImage(url, filepath, retryCount + 1);
    } else {
      console.error(`❌ Failed to download ${url} after ${config.MAX_RETRIES} retries:`, error.message);
      return null;
    }
  }
}

/**
 * Download all images for a distribution
 */
async function downloadDistributionImages(distro, distributionData) {
  const downloadedPaths = {
    logo: null,
    thumbnail: null,
    screenshot: null
  };
  
  try {
    // Download logo
    if (distributionData.logo) {
      const logoExt = path.extname(new URL(distributionData.logo).pathname) || '.png';
      const logoPath = path.join(config.LOGOS_DIR, `${distro}${logoExt}`);
      const downloadPath = await downloadImage(distributionData.logo, logoPath);
      downloadedPaths.logo = downloadPath?.replace(/\\/g, '/').replace(/data/g, ''); // Normalize path
    }
    
    // Download thumbnail screenshot
    if (distributionData.thumbnail) {
      const thumbnailExt = path.extname(new URL(distributionData.thumbnail).pathname) || '.png';
      const thumbnailPath = path.join(config.THUMBNAILS_DIR, `${distro}${thumbnailExt}`);
      const downloadPath = await downloadImage(distributionData.thumbnail, thumbnailPath);
      downloadedPaths.thumbnail = downloadPath?.replace(/\\/g, '/').replace(/data/g, ''); // Normalize path
    }
    
    // Download large screenshot
    if (distributionData.screenshot) {
      const screenshotExt = path.extname(new URL(distributionData.screenshot).pathname) || '.png';
      const screenshotPath = path.join(config.SCREENSHOTS_DIR, `${distro}${screenshotExt}`);
      const downloadPath = await downloadImage(distributionData.screenshot, screenshotPath);
      downloadedPaths.screenshot = downloadPath?.replace(/\\/g, '/').replace(/data/g, ''); // Normalize path
    }
  } catch (error) {
    console.error(`❌ Error downloading images for ${distro}:`, error.message);
  }
  
  return downloadedPaths;
}

module.exports = {
  sleep,
  downloadImage,
  downloadDistributionImages
};