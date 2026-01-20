# DistroWatch Scraper

A comprehensive Node.js application for scraping DistroWatch data to track Linux distributions, their metadata, and visual assets.

## Features

- 🚀 **Modern modular architecture** with single-responsibility modules
- 📊 **Complete DistroWatch data extraction** (metadata, descriptions, ratings, homepage)
- 🖼️ **Comprehensive image downloading**: Logos, thumbnails, and high-resolution screenshots
- 📁 **Organized output structure** with separate folders for different content types
- ⚙️ **Smart processing modes**: Update existing data or full replacement
- ⚡ **Intelligent skipping**: Avoid re-scraping existing distributions (with force option)
- 🔧 **Environment configuration** with `.env` support
- 📈 **Popularity and rating tracking** from DistroWatch rankings
- 🚫 **Rate limiting** and graceful error handling
- 🛡️ **Robust parsing** that adapts to DistroWatch's HTML structure
- 💾 **JSON output** with both URLs and local file paths
- 📝 **Command line interface** with helpful options

## Prerequisites

- Node.js >= 18.0.0
- npm (comes with Node.js)

## Installation

1. Clone or download this project
2. Navigate to the project directory:
   ```bash
   cd distrowatch-scraper
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` to configure your scraping settings:
   - `INDEX_URL`: DistroWatch popularity page URL
   - `DISTRO_URL`: Base URL for individual distribution pages
   - `OUTPUT_DIR`: Directory to save scraped data and images
   - `OUTPUT_FILE`: JSON filename for scraped data
   - `REQUEST_DELAY`: Delay between requests (milliseconds)
   - `MAX_RETRIES`: Maximum retry attempts for failed requests
   - `TIMEOUT`: Request timeout in milliseconds
   - `USER_AGENT`: HTTP User-Agent string for requests

## Output Structure

The scraper creates a comprehensive directory structure:

```
data/
├── distros.json              # Complete distribution data
└── images/
    ├── logos/                # Distribution logos
    │   ├── ubuntu.png
    │   ├── fedora.png
    │   └── ...
    ├── thumbnails/           # Small screenshot thumbnails
    │   ├── ubuntu.png
    │   ├── fedora.png
    │   └── ...
    └── screenshots/          # High-resolution screenshots
        ├── ubuntu.png
        ├── fedora.png
        └── ...
```

## Data Output Format

Each distribution entry includes:

```json
{
  "slug": "ubuntu",
  "name": "Ubuntu", 
  "lastUpdate": "2026-01-10 21:20",
  "description": "Ubuntu is a complete desktop Linux...",
  "homepage": "https://ubuntu.com/",
  "osType": "Linux",
  "basedOn": "Debian",
  "origin": "Isle of Man",
  "architecture": "armhf, ppc64el, riscv, s390x, x86_64",
  "desktop": "GNOME, Unity",
  "category": "Beginners, Desktop, Server, Live Medium",
  "status": "Active",
  "popularity": 10,
  "rating": 7.7,
  "reviewCount": 370,
  "logo": "https://distrowatch.com/images/...",
  "thumbnail": "https://distrowatch.com/images/...",
  "screenshot": "https://distrowatch.com/images/...",
  "localPaths": {
    "logo": "./data/images/logos/ubuntu.png",
    "thumbnail": "./data/images/thumbnails/ubuntu.png", 
    "screenshot": "./data/images/screenshots/ubuntu_large.png"
  }
}
```

## Command Line Options

The scraper supports several command line options for flexible operation:

```bash
node index.js [options]
```

### Options:

- `--update` or `-u`: **Update mode** - Merge new data with existing `distros.json` instead of replacing it
- `--force` or `-f`: **Force refresh** - Scrape all distributions, ignoring existing data
- `--help` or `-h`: **Show help** - Display usage information and exit

### Examples:

```bash
# Default: Replace all data, skip existing distributions
node index.js

# Update existing data, only scrape new distributions
node index.js --update

# Force refresh all distributions (ignore existing data)
node index.js --force

# Update mode + force refresh all distributions
node index.js --update --force

# Show help information
node index.js --help
```

### Smart Processing Modes:

1. **Default Mode**: Replaces all data but skips distributions already in the JSON file
2. **Update Mode** (`--update`): Merges new data with existing file, preserving untouched distributions
3. **Force Mode** (`--force`): Scrapes all distributions regardless of existing data
4. **Combined** (`--update --force`): Updates existing file and refreshes all distribution data

## Usage

### Production Mode
```bash
npm start
```

### Development Mode (with file watching)
```bash
npm run dev
```

## How It Works

1. **Fetch Distribution List**: Scrapes DistroWatch popularity rankings to get all active distributions
2. **Individual Scraping**: For each distribution, extracts:
   - Basic metadata (name, description, last update)
   - Technical details (architecture, desktop, base distribution)
   - Popularity metrics and user ratings
   - Visual assets (logo, screenshots)
3. **Image Download**: Downloads and saves all images locally with organized naming
4. **Data Export**: Saves complete dataset as JSON with both original URLs and local paths

## Project Structure

```
distrowatch-scraper/
├── .github/
│   └── copilot-instructions.md  # GitHub Copilot configuration
├── data/                       # Output directory (created automatically)
│   ├── distros.json           # Main output file
│   └── images/                # Downloaded images organized by type
│       ├── logos/
│       ├── thumbnails/
│       └── screenshots/
├── src/                        # Source code directory
│   ├── config.js              # Configuration management
│   ├── cli.js                 # Command line interface
│   ├── scraper.js             # Web scraping logic
│   ├── imageDownloader.js     # Image downloading functions
│   └── fileOperations.js      # File read/write operations
├── index.js                   # Main application entry point
├── package.json               # Node.js project configuration  
├── .env.example               # Environment variables template
├── .env                       # Your local configuration (create from template)
├── .gitignore                # Git ignore rules
└── README.md                 # This documentation
```

## Architecture & Key Modules

### Core Modules (src/):

- **`config.js`**: Configuration management and environment variables
- **`cli.js`**: Command line interface with argument parsing and help
- **`scraper.js`**: Web scraping functionality
  - `fetchAllDistroSlugs()`: Get all active distributions from popularity page
  - `scrapeDistro(slug)`: Extract complete data for specific distribution
- **`imageDownloader.js`**: Image download management
  - `downloadDistributionImages()`: Handle all image types for a distribution
  - `downloadImage()`: Download individual images with error handling
- **`fileOperations.js`**: Data persistence and file management
  - `loadExistingData()`: Load existing distribution data
  - `saveDataToFile()`: Save data with proper formatting
  - `mergeDistributionData()`: Smart merging of existing and new data

### Main Application Flow:

1. **Parse CLI arguments** and initialize configuration
2. **Load existing data** (if not force refresh) to determine what to skip
3. **Fetch distribution list** from DistroWatch popularity rankings
4. **Process each distribution**:
   - Skip if exists (unless force refresh)
   - Scrape distribution data
   - Download all associated images
   - Add local file paths to data
5. **Save results** using update or replace mode
6. **Provide summary** of operations performed

## Development

This project follows modern Node.js best practices with a clean, modular architecture:

- ✅ **Modular design** with single-responsibility modules
- ✅ **Separation of concerns** (config, CLI, scraping, images, file ops)
- ✅ **Modern JavaScript** ES6+ features throughout
- ✅ **Clean architecture** with dependency injection
- ✅ **Comprehensive error handling** and graceful degradation
- ✅ **Environment-based configuration** with `.env` support
- ✅ **Graceful process management** and signal handling

### Adding New Features

1. **Follow modular structure**: Add new functionality to appropriate modules in `src/`
2. **Single responsibility**: Each function should have one clear purpose
3. **Update configuration**: Add new settings to `src/config.js` if needed
4. **Test thoroughly**: Use `npm run dev` for development testing
5. **Update documentation**: Reflect changes in this README

### Module Guidelines

- **`src/config.js`**: Add new environment variables and computed paths
- **`src/cli.js`**: Add new command line options and help text
- **`src/scraper.js`**: Add new parsing functions or data extraction
- **`src/imageDownloader.js`**: Add new image types or download strategies
- **`src/fileOperations.js`**: Add new file formats or data operations

## Dependencies

### Production Dependencies
- **axios**: HTTP client for making web requests
- **cheerio**: Server-side jQuery-like HTML parsing
- **dotenv**: Loads environment variables from `.env` file

### Development Dependencies
- **nodemon**: Monitors for file changes and restarts the server automatically

## Rate Limiting & Ethics

This scraper is designed to be respectful to DistroWatch:
- Configurable delays between requests (default: 1 second)
- Proper User-Agent identification
- Error handling and retry logic
- No concurrent requests to avoid server overload

## Troubleshooting

### Common Issues

- **"No new data to save"**: All distributions were skipped (use `--force` to refresh)
- **Images not downloading**: Check internet connection and DistroWatch accessibility
- **Empty results**: Verify DistroWatch hasn't changed their HTML structure  
- **Permission errors**: Ensure write access to the output directory
- **Rate limiting**: Increase `REQUEST_DELAY` if getting blocked
- **Module not found errors**: Ensure all files in `src/` directory exist

### Performance Tips

- **Regular updates**: Use `--update` for daily/weekly runs to only scrape new distributions
- **Incremental scraping**: Default behavior skips existing distributions automatically
- **Force refresh**: Only use `--force` when you need to update all existing data
- **Rate limiting**: Adjust `REQUEST_DELAY` based on your internet connection and DistroWatch response

## License

ISC License - see package.json for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include Node.js version and OS information
