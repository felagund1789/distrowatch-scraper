# DistroWatch Scraper

A comprehensive Node.js application for scraping DistroWatch data to track Linux distributions, their metadata, and visual assets.

## Features

- 🚀 Modern Node.js application with ES6+ features
- 📊 Complete DistroWatch data extraction (metadata, descriptions, ratings)
- 🖼️ **Image downloading**: Logos, screenshots, and high-resolution images
- 🗂️ **Organized output structure** with separate folders for different content types
- 🔧 **Environment configuration** with `.env` support
- 📈 **Popularity and rating tracking** from DistroWatch rankings
- ⚡ **Rate limiting** and graceful error handling
- 🛡️ **Robust parsing** that adapts to DistroWatch's HTML structure
- 💾 **JSON output** with both URLs and local file paths

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
    ├── screenshots/          # High-resolution screenshots
    │   ├── ubuntu.png
    │   ├── fedora.png
    │   └── ...
    └── thumbnails/           # Thumbnails
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
  "screenshot": "https://distrowatch.com/images/...",
  "thumbnail": "https://distrowatch.com/images/...",
  "localPaths": {
    "logo": "./data/images/logos/ubuntu.png",
    "screenshot": "./data/images/screenshots/ubuntu.png", 
    "thumbnail": "./data/images/thumbnail/ubuntu.png"
  }
}
```

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
├── index.js                   # Main application with all scraping logic
├── package.json               # Node.js project configuration  
├── .env.example               # Environment variables template
├── .env                       # Your local configuration (create from template)
├── .gitignore                # Git ignore rules
└── README.md                 # This documentation
```

## Key Functions

- **`fetchAllDistroSlugs()`**: Scrapes DistroWatch popularity page for active distributions
- **`scrapeDistro(slug)`**: Extracts complete data for a specific distribution
- **`downloadImage(url, filepath)`**: Downloads and saves distribution images
- **`parseInfoTable($)`**: Parses distribution metadata from HTML structure

## Development

This project follows Node.js best practices:

- ✅ Modern JavaScript ES6+ features
- ✅ NPM package.json conventions
- ✅ Semantic versioning
- ✅ Comprehensive error handling
- ✅ Environment-based configuration
- ✅ Graceful process management

### Adding New Features

1. Follow the existing code structure in `index.js`
2. Add any new dependencies via `npm install <package-name>`
3. Update this README if you add new configuration options
4. Test your changes with `npm run dev`

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

- **Images not downloading**: Check internet connection and DistroWatch accessibility
- **Empty results**: Verify DistroWatch hasn't changed their HTML structure  
- **Permission errors**: Ensure write access to the output directory
- **Rate limiting**: Increase `REQUEST_DELAY` if getting blocked

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
