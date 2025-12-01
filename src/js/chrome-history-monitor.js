// Chrome History Monitor for DreamHRAi
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const os = require('os');

class ChromeHistoryMonitor {
    constructor() {
        this.platform = os.platform();
        this.chromePaths = this.getChromePaths();
    }

    /**
     * Get Chrome history file paths based on platform
     */
    getChromePaths() {
        const paths = [];

        if (this.platform === 'win32') {
            // Windows Chrome paths
            const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
            const defaultProfile = path.join(userDataDir, 'Default', 'History');
            const systemLevelProfile = path.join(userDataDir, 'System Profile', 'History');

            paths.push(defaultProfile, systemLevelProfile);

            // Check for Profile 1, Profile 2, etc.
            for (let i = 1; i <= 10; i++) {
                paths.push(path.join(userDataDir, `Profile ${i}`, 'History'));
            }
        } else if (this.platform === 'darwin') {
            // macOS Chrome paths
            const userDataDir = path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
            paths.push(path.join(userDataDir, 'Default', 'History'));

            // Check for Profile 1, Profile 2, etc.
            for (let i = 1; i <= 10; i++) {
                paths.push(path.join(userDataDir, `Profile ${i}`, 'History'));
            }
        } else if (this.platform === 'linux') {
            // Linux Chrome paths
            const userDataDir = path.join(os.homedir(), '.config', 'google-chrome');
            paths.push(path.join(userDataDir, 'Default', 'History'));

            // Check for Profile 1, Profile 2, etc.
            for (let i = 1; i <= 10; i++) {
                paths.push(path.join(userDataDir, `Profile ${i}`, 'History'));
            }
        }

        return paths;
    }

    /**
     * Find available Chrome history files
     */
    findChromeHistoryFiles() {
        const availableFiles = [];

        this.chromePaths.forEach(historyPath => {
            try {
                if (fs.existsSync(historyPath)) {
                    availableFiles.push(historyPath);
                }
            } catch (error) {
                // Skip inaccessible files
                console.log(`Skipping inaccessible Chrome history file: ${historyPath}`);
            }
        });

        return availableFiles;
    }

    /**
     * Read Chrome history from SQLite database
     */
    async readChromeHistory(historyPath) {
        return new Promise((resolve, reject) => {
            const history = [];

            // Chrome locks the History file while running, so we need to copy it
            const tempHistoryPath = this.createTempCopy(historyPath);

            if (!tempHistoryPath) {
                resolve([]); // Return empty if can't access
                return;
            }

            const db = new sqlite3.Database(tempHistoryPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    console.error('Error opening Chrome history database:', err);
                    // Clean up temp file
                    try {
                        fs.unlinkSync(tempHistoryPath);
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                    resolve([]);
                    return;
                }

                // Query for URL history with visit times
                const query = `
                    SELECT
                        urls.url,
                        urls.title,
                        urls.visit_count,
                        urls.typed_count,
                        urls.last_visit_time,
                        urls.hidden,
                        visits.visit_time,
                        visits.from_visit,
                        visits.transition,
                        visits.segment_id,
                        visits.visit_duration
                    FROM urls
                    LEFT JOIN visits ON urls.id = visits.url
                    WHERE urls.hidden = 0
                    ORDER BY visits.visit_time DESC
                    LIMIT 10000
                `;

                db.all(query, [], (err, rows) => {
                    if (err) {
                        console.error('Error querying Chrome history:', err);
                        db.close();
                        // Clean up temp file
                        try {
                            fs.unlinkSync(tempHistoryPath);
                        } catch (e) {
                            // Ignore cleanup errors
                        }
                        resolve([]);
                        return;
                    }

                    // Process the results
                    rows.forEach(row => {
                        if (row.visit_time && row.url) {
                            // Chrome uses microseconds since 1601-01-01, convert to JavaScript timestamp
                            const visitTimestamp = this.chromeTimeToJSTime(row.visit_time);

                            history.push({
                                url: row.url,
                                title: row.title || 'No Title',
                                visitTime: visitTimestamp,
                                visitCount: row.visit_count || 0,
                                typedCount: row.typed_count || 0,
                                lastVisitTime: row.last_visit_time ? this.chromeTimeToJSTime(row.last_visit_time) : null,
                                fromVisit: row.from_visit,
                                transition: row.transition,
                                segmentId: row.segment_id,
                                visitDuration: row.visit_duration || 0,
                                profile: path.basename(path.dirname(historyPath))
                            });
                        }
                    });

                    db.close();

                    // Clean up temp file
                    try {
                        fs.unlinkSync(tempHistoryPath);
                    } catch (e) {
                        // Ignore cleanup errors
                    }

                    resolve(history);
                });
            });
        });
    }

    /**
     * Create a temporary copy of Chrome history file to avoid locks
     */
    createTempCopy(originalPath) {
        try {
            const tempDir = os.tmpdir();
            const tempFilename = `chrome_history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.db`;
            const tempPath = path.join(tempDir, tempFilename);

            // Copy the file
            fs.copyFileSync(originalPath, tempPath);

            return tempPath;
        } catch (error) {
            console.error('Error creating temp copy of Chrome history:', error);
            return null;
        }
    }

    /**
     * Convert Chrome timestamp (microseconds since 1601-01-01) to JavaScript timestamp
     */
    chromeTimeToJSTime(chromeTime) {
        // Chrome uses microseconds since 1601-01-01 00:00:00 UTC
        // JavaScript uses milliseconds since 1970-01-01 00:00:00 UTC

        const chromeEpoch = Date.UTC(1601, 0, 1); // 1601-01-01 in milliseconds
        const microseconds = chromeTime;

        // Convert microseconds to milliseconds and adjust for epoch difference
        return chromeEpoch + (microseconds / 1000);
    }

    /**
     * Filter history by today's date in Asia/Dhaka timezone
     */
    filterByToday(history) {
        const filtered = [];
        const today = this.getTodayInDhaka();

        history.forEach(entry => {
            const dhakaTime = this.convertToDhakaTime(entry.visitTime);
            const entryDate = dhakaTime.toDateString();

            // Check if visit is from today
            if (entryDate === today) {
                filtered.push({
                    ...entry,
                    dhakaTime: dhakaTime.toISOString(),
                    dhakaTimeFormatted: dhakaTime.toLocaleString('en-US', {
                        timeZone: 'Asia/Dhaka',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    })
                });
            }
        });

        return filtered;
    }

    /**
     * Get today's date in Asia/Dhaka timezone
     */
    getTodayInDhaka() {
        const now = new Date();
        const dhakaTime = this.convertToDhakaTime(now.getTime());
        return dhakaTime.toDateString();
    }

    /**
     * Convert timestamp to Asia/Dhaka timezone
     */
    convertToDhakaTime(timestamp) {
        // Create date object in UTC
        const utcDate = new Date(timestamp);

        // Convert to Asia/Dhaka timezone (UTC+6)
        const dhakaOffset = 6 * 60; // 6 hours in minutes
        const localOffset = utcDate.getTimezoneOffset(); // Local timezone offset in minutes

        // Adjust for both timezone differences
        const totalOffset = dhakaOffset + localOffset;
        const dhakaTime = new Date(utcDate.getTime() + (totalOffset * 60 * 1000));

        return dhakaTime;
    }

    /**
     * Group history by date
     */
    groupByDate(history) {
        const grouped = {};

        history.forEach(entry => {
            const date = entry.dhakaTimeFormatted.split(',')[0]; // Get date part only

            if (!grouped[date]) {
                grouped[date] = [];
            }

            grouped[date].push(entry);
        });

        return grouped;
    }

    /**
     * Analyze browsing patterns
     */
    analyzeBrowsingPatterns(history) {
        const analysis = {
            totalVisits: history.length,
            uniqueUrls: new Set(history.map(h => h.url)).size,
            mostVisitedSites: {},
            timeDistribution: {},
            topDomains: {}
        };

        history.forEach(entry => {
            // Count visits per URL
            const url = entry.url;
            analysis.mostVisitedSites[url] = (analysis.mostVisitedSites[url] || 0) + 1;

            // Extract domain
            try {
                const domain = new URL(url).hostname;
                analysis.topDomains[domain] = (analysis.topDomains[domain] || 0) + 1;
            } catch (e) {
                // Invalid URL, skip
            }

            // Time distribution by hour
            const hour = new Date(entry.visitTime).getHours();
            analysis.timeDistribution[hour] = (analysis.timeDistribution[hour] || 0) + 1;
        });

        // Sort and limit results
        analysis.mostVisitedSites = Object.entries(analysis.mostVisitedSites)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        analysis.topDomains = Object.entries(analysis.topDomains)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        return analysis;
    }

    /**
     * Save Chrome history report
     */
    async saveHistoryReport(history, analysis) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const reportsDir = path.join(__dirname, '..', 'reports');

            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            // Save JSON report
            const jsonFilename = `chrome-history-${timestamp}.json`;
            const jsonFilepath = path.join(reportsDir, jsonFilename);

            const jsonReport = {
                timestamp: new Date().toISOString(),
                platform: this.platform,
                timezone: 'Asia/Dhaka (GMT+6)',
                date: this.getTodayInDhaka(),
                summary: {
                    totalVisits: analysis.totalVisits,
                    uniqueUrls: analysis.uniqueUrls,
                    date: this.getTodayInDhaka()
                },
                analysis: {
                    topSites: analysis.mostVisitedSites,
                    topDomains: analysis.topDomains,
                    timeDistribution: analysis.timeDistribution
                },
                history: history.map(entry => ({
                    url: entry.url,
                    title: entry.title,
                    visitTime: entry.dhakaTime,
                    formattedTime: entry.dhakaTimeFormatted,
                    visitCount: entry.visitCount,
                    profile: entry.profile
                }))
            };

            fs.writeFileSync(jsonFilepath, JSON.stringify(jsonReport, null, 2), 'utf8');

            // Save text report
            const txtFilename = `chrome-history-${timestamp}.txt`;
            const txtFilepath = path.join(reportsDir, txtFilename);

            let reportContent = `Chrome Browser History Report\n`;
            reportContent += `Generated: ${new Date().toLocaleString()}\n`;
            reportContent += `Timezone: Asia/Dhaka (GMT+6)\n`;
            reportContent += `Date: ${this.getTodayInDhaka()}\n`;
            reportContent += `Total Visits Today: ${analysis.totalVisits}\n`;
            reportContent += `Unique URLs: ${analysis.uniqueUrls}\n\n`;

            reportContent += 'TOP VISITED SITES:\n';
            reportContent += '='.repeat(50) + '\n';
            analysis.mostVisitedSites.forEach(([url, count], index) => {
                reportContent += `${index + 1}. ${url} (${count} visits)\n`;
            });

            reportContent += '\nTOP DOMAINS:\n';
            reportContent += '='.repeat(50) + '\n';
            analysis.topDomains.forEach(([domain, count], index) => {
                reportContent += `${index + 1}. ${domain} (${count} visits)\n`;
            });

            reportContent += '\nTODAY\'S BROWSING HISTORY:\n';
            reportContent += '='.repeat(50) + '\n';

            const groupedHistory = this.groupByDate(history);
            Object.keys(groupedHistory).sort().reverse().forEach(date => {
                reportContent += `\n${date}:\n`;
                groupedHistory[date].forEach(entry => {
                    const time = entry.dhakaTimeFormatted.split(',')[1].trim();
                    reportContent += `  ${time} - ${entry.title} (${entry.url})\n`;
                });
            });

            fs.writeFileSync(txtFilepath, reportContent, 'utf8');

            return {
                success: true,
                jsonFile: {
                    filepath: jsonFilepath,
                    filename: jsonFilename
                },
                textFile: {
                    filepath: txtFilepath,
                    filename: txtFilename
                },
                totalVisits: analysis.totalVisits
            };

        } catch (error) {
            console.error('Error saving Chrome history report:', error);
            throw error;
        }
    }


    /**
     * Main function to monitor Chrome history for today only
     */
    async monitorChromeHistory() {
        try {
            console.log('Starting Chrome history monitoring for today...');

            const historyFiles = this.findChromeHistoryFiles();
            console.log(`Found ${historyFiles.length} Chrome history files`);

            if (historyFiles.length === 0) {
                throw new Error('No Chrome history files found. Make sure Chrome is installed and has browsing history.');
            }

            let allHistory = [];

            // Read history from all available Chrome profiles
            for (const historyFile of historyFiles) {
                try {
                    console.log(`Reading Chrome history from: ${historyFile}`);
                    const profileHistory = await this.readChromeHistory(historyFile);
                    allHistory = allHistory.concat(profileHistory);
                    console.log(`Found ${profileHistory.length} visits in this profile`);
                } catch (error) {
                    console.error(`Error reading history from ${historyFile}:`, error);
                }
            }

            console.log(`Total history entries collected: ${allHistory.length}`);

            // Filter by today's date in Asia/Dhaka timezone
            const filteredHistory = this.filterByToday(allHistory);
            console.log(`History entries for today: ${filteredHistory.length}`);

            // Analyze browsing patterns
            const analysis = this.analyzeBrowsingPatterns(filteredHistory);

            // Save report
            const reportResult = await this.saveHistoryReport(filteredHistory, analysis);

            console.log('Chrome history report saved:', reportResult.textFile.filepath);

            return {
                success: true,
                historyFiles: historyFiles.length,
                totalHistory: allHistory.length,
                filteredHistory: filteredHistory.length,
                analysis: analysis,
                report: reportResult
            };

        } catch (error) {
            console.error('Chrome history monitoring failed:', error);
            throw error;
        }
    }
}

module.exports = ChromeHistoryMonitor;
