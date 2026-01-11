# DistroWatch Scraper

A Node.js application for scraping DistroWatch data to track Linux distributions and their updates.

## Features

- 🚀 Modern Node.js application with ES6+ features
- 📊 Web scraping capabilities using Axios and Cheerio
- 🔧 Development-friendly with hot reloading support
- 📁 Organized data output structure
- ⚡ Graceful error handling and shutdown
- 🛡️ Environment configuration support

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
   - `REQUEST_DELAY`: Delay between requests (milliseconds)
   - `MAX_RETRIES`: Maximum retry attempts for failed requests
   - `OUTPUT_DIR`: Directory to save scraped data

## Usage

### Production Mode
```bash
npm start
```

### Development Mode (with file watching)
```bash
npm run dev
```

## Project Structure

```
distrowatch-scraper/
├── .github/
│   └── copilot-instructions.md  # GitHub Copilot configuration
├── data/                        # Output directory for scraped data
├── index.js                     # Main application entry point
├── package.json                 # Node.js project configuration
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

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