/**
 * Command Line Interface module
 */

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  
  return {
    updateMode: args.includes('--update') || args.includes('-u'),
    forceRefresh: args.includes('--force') || args.includes('-f'),
    showHelp: args.includes('--help') || args.includes('-h')
  };
}

/**
 * Display usage information
 */
function showUsage() {
  console.log('\n📖 DistroWatch Scraper Usage:');
  console.log('\n   node index.js [options]');
  console.log('\n   Options:');
  console.log('     --update, -u      Update existing distros.json instead of replacing it');
  console.log('     --force, -f       Force refresh all distros (skip existing data check)');
  console.log('     --help, -h        Show this help message');
  console.log('\n   Examples:');
  console.log('     node index.js                # Replace all data, skip existing distros');
  console.log('     node index.js --update       # Update mode, skip existing distros');
  console.log('     node index.js --force        # Force refresh all distros');
  console.log('     node index.js --update --force  # Update mode, refresh all distros');
  console.log('');
}

/**
 * Display startup information
 */
function displayStartupInfo(options) {
  console.log('🚀 Starting DistroWatch Scraper...');
  console.log('📦 Node.js version:', process.version);
  console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
  console.log('⚡ Mode:', options.updateMode ? 'Update existing data' : 'Replace all data');
  console.log('💪 Force refresh:', options.forceRefresh ? 'Yes' : 'No (skip existing)');
}

module.exports = {
  parseArguments,
  showUsage,
  displayStartupInfo
};