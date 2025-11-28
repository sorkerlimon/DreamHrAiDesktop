// Screenshot functionality for DreamHRAi

const fs = require('fs');
const path = require('path');
const screenshot = require('screenshot-desktop');

class ScreenshotManager {
    constructor() {
        // Create screenshots directory if it doesn't exist
        this.screenshotsDir = path.join(__dirname, '..', 'screenshots');
        this.ensureScreenshotsDirectory();
    }

    ensureScreenshotsDirectory() {
        try {
            if (!fs.existsSync(this.screenshotsDir)) {
                fs.mkdirSync(this.screenshotsDir, { recursive: true });
                console.log('Screenshots directory created:', this.screenshotsDir);
            }
        } catch (error) {
            console.error('Failed to create screenshots directory:', error);
        }
    }

    async takeScreenshot() {
        try {
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `time-in-${timestamp}.png`;
            const filepath = path.join(this.screenshotsDir, filename);

            console.log('Taking screenshot...');

            // Take screenshot of entire screen
            const img = await screenshot();

            // Save the screenshot
            fs.writeFileSync(filepath, img);

            console.log('Screenshot saved successfully:', filepath);

            return {
                success: true,
                filepath: filepath,
                filename: filename
            };

        } catch (error) {
            console.error('Screenshot failed:', error);

            return {
                success: false,
                error: error.message
            };
        }
    }


}

// Create global instance
const screenshotManager = new ScreenshotManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScreenshotManager;
}
