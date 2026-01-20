/**
 * File operations module for handling JSON data
 */

const fs = require('fs');
const path = require('path');

/**
 * Ensure directory exists, create if it doesn't
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Load existing distribution data from JSON file
 */
function loadExistingData(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    console.error(`⚠️  Could not load existing data from ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Save distribution data to JSON file
 */
function saveDataToFile(data, filePath) {
  try {
    // Ensure directory exists
    ensureDirectoryExists(path.dirname(filePath));
    
    // Write formatted JSON
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ Failed to save data to ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Merge new data with existing data based on slug
 */
function mergeDistributionData(existingData, newData) {
  const existingMap = new Map();
  
  // Add existing data to map
  existingData.forEach(distro => {
    existingMap.set(distro.slug, distro);
  });
  
  // Update with new data
  newData.forEach(distro => {
    existingMap.set(distro.slug, distro);
  });
  
  // Convert back to sorted array
  return Array.from(existingMap.values()).sort((a, b) => a.slug.localeCompare(b.slug));
}

module.exports = {
  ensureDirectoryExists,
  loadExistingData,
  saveDataToFile,
  mergeDistributionData
};