#!/usr/bin/env node

/**
 * DistroWatch Scraper - Main Entry Point
 * A comprehensive Node.js application for scraping DistroWatch data
 */

const path = require('path');
const config = require('./src/config');
const { parseArguments, showUsage, displayStartupInfo } = require('./src/cli');
const { fetchAllDistroSlugs, scrapeDistro } = require('./src/scraper');
const { downloadDistributionImages, sleep } = require('./src/imageDownloader');
const { 
  ensureDirectoryExists, 
  loadExistingData, 
  saveDataToFile, 
  mergeDistributionData 
} = require('./src/fileOperations');

/**
 * Initialize application directories
 */
function initializeDirectories() {
  [config.IMAGE_DIR, config.LOGOS_DIR, config.THUMBNAILS_DIR, config.SCREENSHOTS_DIR].forEach(dir => {
    ensureDirectoryExists(dir);
  });
}

/**
 * Process a single distribution
 */
async function processDistribution(distro) {
  console.log(`\n🔍 Processing ${distro}...`);
  
  // Scrape distribution data
  const data = await scrapeDistro(distro);
  
  // Download images
  const downloadedPaths = await downloadDistributionImages(distro, data);
  
  // Add local file paths to data
  data.localPaths = downloadedPaths;
  
  console.log(`✅ Completed ${distro}`);
  return data;
}

/**
 * Main application entry point
 */
async function main() {
  try {
    // Parse command line arguments
    const options = parseArguments();
    
    if (options.showHelp) {
      showUsage();
      process.exit(0);
    }
    
    // Display startup information
    displayStartupInfo(options);
    console.log('⏱️  Request delay:', config.REQUEST_DELAY + 'ms');
    console.log('📁 Output directory:', config.OUTPUT_DIR);
    
    // Initialize directories
    initializeDirectories();
    console.log('✅ DistroWatch Scraper initialized successfully!');
    
    // Fetch all distribution slugs
    const distributions = ["arch", "debian", "fedora"]; //await fetchAllDistroSlugs();
    console.log(`🎯 Ready to scrape ${distributions.length} distributions`);
    
    // Load existing data to check for existing distros (unless force refresh)
    let existingSlugs = new Set();
    const outputPath = path.join(config.OUTPUT_DIR, config.OUTPUT_FILE);
    
    if (!options.forceRefresh) {
      const existingData = loadExistingData(outputPath);
      existingSlugs = new Set(existingData.map(d => d.slug));
      if (existingData.length > 0) {
        console.log(`📖 Loaded ${existingData.length} existing distributions`);
      }
    }
    
    // Process distributions
    const results = [];
    let skippedCount = 0;
    
    for (const distro of distributions) {
      try {
        // Skip if distro already exists and not forcing refresh
        if (!options.forceRefresh && existingSlugs.has(distro)) {
          console.log(`⏭️  Skipping ${distro} (already exists, use --force to refresh)`);
          skippedCount++;
          continue;
        }
        
        const data = await processDistribution(distro);
        results.push(data);
        
        // Rate limiting
        await sleep(config.REQUEST_DELAY);
      } catch (error) {
        console.error(`❌ Failed to process ${distro}:`, error.message);
      }
    }
    
    // Processing summary
    console.log(`\n📊 Processing complete: ${results.length} scraped, ${skippedCount} skipped`);
    
    // Prepare final data
    let finalResults = results;
    
    if (options.updateMode && results.length > 0) {
      // Merge with existing data
      const existingData = loadExistingData(outputPath);
      finalResults = mergeDistributionData(existingData, results);
      console.log(`🔄 Updated ${results.length} distributions, total: ${finalResults.length}`);
    } else if (results.length > 0) {
      console.log(`💾 Saving ${finalResults.length} distributions (replace mode)`);
    }
    
    // Save results if we have data to save
    if (finalResults.length > 0) {
      const success = saveDataToFile(finalResults, outputPath);
      if (success) {
        console.log(`✅ Results saved to ${outputPath}`);
      } else {
        console.error(`❌ Failed to save results to ${outputPath}`);
        process.exit(1);
      }
    } else {
      console.log('ℹ️  No new data to save');
    }
    
  } catch (error) {
    console.error('❌ Error in main application:', error.message);
    process.exit(1);
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