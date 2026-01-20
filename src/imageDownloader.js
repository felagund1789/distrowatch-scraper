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
 * Download an image from URL and save to local file
 */
async function downloadImage(url, filepath) {
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
    console.error(`❌ Failed to download ${url}:`, error.message);
    return null;
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
      downloadedPaths.logo = await downloadImage(distributionData.logo, logoPath);
    }
    
    // Download thumbnail screenshot
    if (distributionData.thumbnail) {
      const thumbnailExt = path.extname(new URL(distributionData.thumbnail).pathname) || '.png';
      const thumbnailPath = path.join(config.THUMBNAILS_DIR, `${distro}${thumbnailExt}`);
      downloadedPaths.thumbnail = await downloadImage(distributionData.thumbnail, thumbnailPath);
    }
    
    // Download large screenshot
    if (distributionData.screenshot) {
      const screenshotExt = path.extname(new URL(distributionData.screenshot).pathname) || '.png';
      const screenshotPath = path.join(config.SCREENSHOTS_DIR, `${distro}${screenshotExt}`);
      downloadedPaths.screenshot = await downloadImage(distributionData.screenshot, screenshotPath);
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