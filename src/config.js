/**
 * Configuration module for DistroWatch Scraper
 */

const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

const config = {
  // URLs
  INDEX_URL: process.env.INDEX_URL || "https://distrowatch.com/dwres.php?resource=popularity",
  DISTRO_URL: process.env.DISTRO_URL || "https://distrowatch.com/table.php?distribution=",
  
  // Output settings
  OUTPUT_DIR: process.env.OUTPUT_DIR || "./data",
  OUTPUT_FILE: process.env.OUTPUT_FILE || "distros.json",
  
  // Request settings
  REQUEST_DELAY: parseInt(process.env.REQUEST_DELAY) || 1000,
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES) || 3,
  TIMEOUT: parseInt(process.env.TIMEOUT) || 10000,
  USER_AGENT: process.env.USER_AGENT || "Mozilla/5.0 (DistroWatch Scraper)",
  
  // Computed paths
  get IMAGE_DIR() { return path.join(this.OUTPUT_DIR, "images"); },
  get LOGOS_DIR() { return path.join(this.IMAGE_DIR, "logos"); },
  get THUMBNAILS_DIR() { return path.join(this.IMAGE_DIR, "thumbnails"); },
  get SCREENSHOTS_DIR() { return path.join(this.IMAGE_DIR, "screenshots"); }
};

module.exports = config;