// Process monitoring functionality for DreamHRAi
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ProcessMonitor {
    constructor() {
        this.platform = os.platform();
    }

    /**
     * Get running processes/applications based on the platform
     */
    async getRunningProcesses() {
        try {
            switch (this.platform) {
                case 'win32':
                    return await this.getWindowsProcesses();
                case 'darwin':
                    return await this.getMacProcesses();
                case 'linux':
                    return await this.getLinuxProcesses();
                default:
                    throw new Error(`Unsupported platform: ${this.platform}`);
            }
        } catch (error) {
            console.error('Error getting running processes:', error);
            throw error;
        }
    }

    /**
     * Get running processes on Windows
     */
    getWindowsProcesses() {
        return new Promise((resolve, reject) => {
            // Use tasklist command to get running processes
            exec('tasklist /FO CSV /NH', (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }

                try {
                    const lines = stdout.trim().split('\n');
                    const processes = [];

                    for (const line of lines) {
                        const parts = line.split('","').map(part => part.replace(/"/g, ''));
                        if (parts.length >= 5) {
                            const [imageName, pid, sessionName, sessionNum, memUsage] = parts;
                            processes.push({
                                name: imageName,
                                pid: parseInt(pid),
                                memory: memUsage,
                                session: sessionName,
                                platform: 'windows'
                            });
                        }
                    }

                    resolve(processes);
                } catch (parseError) {
                    reject(parseError);
                }
            });
        });
    }

    /**
     * Get running processes on macOS
     */
    getMacProcesses() {
        return new Promise((resolve, reject) => {
            // Use ps command to get running processes
            exec('ps -eo pid,ppid,pcpu,pmem,comm | head -50', (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }

                try {
                    const lines = stdout.trim().split('\n');
                    const processes = [];

                    for (let i = 1; i < lines.length; i++) {
                        const parts = lines[i].trim().split(/\s+/);
                        if (parts.length >= 5) {
                            const [pid, ppid, cpu, mem, ...commandParts] = parts;
                            const command = commandParts.join(' ');

                            processes.push({
                                name: path.basename(command),
                                pid: parseInt(pid),
                                cpu: parseFloat(cpu),
                                memory: `${mem}%`,
                                command: command,
                                platform: 'macos'
                            });
                        }
                    }

                    resolve(processes);
                } catch (parseError) {
                    reject(parseError);
                }
            });
        });
    }

    /**
     * Get running processes on Linux
     */
    getLinuxProcesses() {
        return new Promise((resolve, reject) => {
            // Use ps command to get running processes
            exec('ps -eo pid,ppid,pcpu,pmem,comm --sort=-pcpu | head -50', (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }

                try {
                    const lines = stdout.trim().split('\n');
                    const processes = [];

                    for (let i = 1; i < lines.length; i++) {
                        const parts = lines[i].trim().split(/\s+/);
                        if (parts.length >= 5) {
                            const [pid, ppid, cpu, mem, ...commandParts] = parts;
                            const command = commandParts.join(' ');

                            processes.push({
                                name: path.basename(command),
                                pid: parseInt(pid),
                                cpu: parseFloat(cpu),
                                memory: `${mem}%`,
                                command: command,
                                platform: 'linux'
                            });
                        }
                    }

                    resolve(processes);
                } catch (parseError) {
                    reject(parseError);
                }
            });
        });
    }

    /**
     * Save process information to a file (both text and JSON formats)
     */
    async saveProcessReport(processes) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const reportsDir = path.join(__dirname, '..', 'reports');

            // Create reports directory if it doesn't exist
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            const summary = this.getProcessSummary(processes);

            // Save JSON report
            const jsonFilename = `process-report-${timestamp}.json`;
            const jsonFilepath = path.join(reportsDir, jsonFilename);

            const jsonReport = {
                timestamp: new Date().toISOString(),
                platform: this.platform,
                summary: {
                    total: summary.total,
                    categories: {
                        osServices: {
                            count: summary.categories.osServices.length,
                            percentage: Math.round((summary.categories.osServices.length / summary.total) * 100)
                        },
                        externalApps: {
                            count: summary.categories.externalApps.length,
                            percentage: Math.round((summary.categories.externalApps.length / summary.total) * 100)
                        },
                        otherProcesses: {
                            count: summary.categories.otherProcesses.length,
                            percentage: Math.round((summary.categories.otherProcesses.length / summary.total) * 100)
                        }
                    },
                    statistics: {
                        totalMemoryUsage: `${Math.round(summary.statistics.totalMemoryUsage / 1024)} MB`,
                        averageMemoryPerProcess: `${Math.round(summary.statistics.averageMemoryPerProcess)} KB`,
                        highCpuProcesses: summary.statistics.highCpu.length,
                        highMemoryProcesses: summary.statistics.highMemory.length,
                        processesByType: summary.statistics.byType
                    }
                },
                processes: {
                    osServices: summary.categories.osServices.slice(0, 20).map(p => ({
                        name: p.name,
                        pid: p.pid,
                        memory: p.memory,
                        session: p.session
                    })),
                    externalApps: summary.categories.externalApps.slice(0, 30).map(p => ({
                        name: p.name,
                        pid: p.pid,
                        memory: p.memory,
                        session: p.session
                    })),
                    otherProcesses: summary.categories.otherProcesses.slice(0, 20).map(p => ({
                        name: p.name,
                        pid: p.pid,
                        memory: p.memory,
                        session: p.session
                    }))
                }
            };

            fs.writeFileSync(jsonFilepath, JSON.stringify(jsonReport, null, 2), 'utf8');

            // Save detailed text report
            const txtFilename = `process-report-${timestamp}.txt`;
            const txtFilepath = path.join(reportsDir, txtFilename);

            let reportContent = `Process Report - ${new Date().toLocaleString()}\n`;
            reportContent += `Platform: ${this.platform}\n`;
            reportContent += `Total Running Processes: ${processes.length}\n\n`;

            reportContent += 'CATEGORY SUMMARY:\n';
            reportContent += '='.repeat(50) + '\n';
            reportContent += `OS Services: ${summary.categories.osServices.length} (${Math.round((summary.categories.osServices.length / summary.total) * 100)}%)\n`;
            reportContent += `External Apps: ${summary.categories.externalApps.length} (${Math.round((summary.categories.externalApps.length / summary.total) * 100)}%)\n`;
            reportContent += `Other Processes: ${summary.categories.otherProcesses.length} (${Math.round((summary.categories.otherProcesses.length / summary.total) * 100)}%)\n\n`;

            reportContent += 'MEMORY STATISTICS:\n';
            reportContent += '='.repeat(50) + '\n';
            reportContent += `Total Memory Usage: ${Math.round(summary.statistics.totalMemoryUsage / 1024)} MB\n`;
            reportContent += `Average Memory/Process: ${Math.round(summary.statistics.averageMemoryPerProcess)} KB\n`;
            reportContent += `High CPU Processes (>10%): ${summary.statistics.highCpu.length}\n`;
            reportContent += `High Memory Processes (>100MB): ${summary.statistics.highMemory.length}\n\n`;

            // OS Services
            reportContent += 'OS SERVICES (System Processes):\n';
            reportContent += '='.repeat(50) + '\n';
            summary.categories.osServices.slice(0, 20).forEach((process, index) => {
                reportContent += `${index + 1}. ${process.name} (PID: ${process.pid}, Memory: ${process.memory})\n`;
            });
            reportContent += '\n';

            // External Applications
            reportContent += 'EXTERNAL APPLICATIONS:\n';
            reportContent += '='.repeat(50) + '\n';
            summary.categories.externalApps.slice(0, 30).forEach((process, index) => {
                reportContent += `${index + 1}. ${process.name} (PID: ${process.pid}, Memory: ${process.memory})\n`;
            });
            reportContent += '\n';

            // Other Processes
            if (summary.categories.otherProcesses.length > 0) {
                reportContent += 'OTHER PROCESSES:\n';
                reportContent += '='.repeat(50) + '\n';
                summary.categories.otherProcesses.slice(0, 20).forEach((process, index) => {
                    reportContent += `${index + 1}. ${process.name} (PID: ${process.pid}, Memory: ${process.memory})\n`;
                });
            }

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
                processCount: processes.length,
                summary: jsonReport.summary
            };

        } catch (error) {
            console.error('Error saving process report:', error);
            throw error;
        }
    }

    /**
     * Get process summary statistics with categorization
     */
    getProcessSummary(processes) {
        // Define known external applications (user applications)
        const knownExternalApps = new Set([
            // Browsers
            'brave.exe', 'chrome.exe', 'msedge.exe', 'firefox.exe', 'opera.exe', 'safari.exe',
            // Development Tools
            'cursor.exe', 'code.exe', 'vscode.exe', 'sublime_text.exe', 'notepad++.exe',
            'webstorm.exe', 'pycharm.exe', 'intellij.exe', 'eclipse.exe', 'netbeans.exe',
            // Communication
            'slack.exe', 'teams.exe', 'discord.exe', 'skype.exe', 'zoom.exe', 'webex.exe',
            // Office/Productivity
            'outlook.exe', 'word.exe', 'excel.exe', 'powerpoint.exe', 'onenote.exe',
            'wps.exe', 'libreoffice.exe', 'openoffice.exe',
            // ChatGPT and AI
            'chatgpt.exe', 'copilot.exe',
            // Design/Creative
            'photoshop.exe', 'illustrator.exe', 'indesign.exe', 'premiere.exe', 'aftereffects.exe',
            'lightroom.exe', 'gimp.exe', 'paint.net.exe',
            // Media Players
            'vlc.exe', 'mpc-hc.exe', 'wmplayer.exe', 'spotify.exe', 'itunes.exe', 'foobar2000.exe',
            // Gaming
            'steam.exe', 'epicgameslauncher.exe', 'origin.exe', 'uplay.exe', 'battlenet.exe',
            'riotclient.exe', 'leagueoflegends.exe',
            // Virtualization/Containerization
            'docker desktop.exe', 'docker.exe', 'vmware.exe', 'virtualbox.exe', 'hyper-v.exe',
            // Database Tools
            'mysqlworkbench.exe', 'pgadmin.exe', 'dbeaver.exe', 'heidisql.exe', 'datagrip.exe',
            'sqlservermanagementstudio.exe', 'toad.exe',
            // Remote/SSH Tools
            'putty.exe', 'winscp.exe', 'filezilla.exe', 'mobaxterm.exe', 'termius.exe',
            // Terminal/Command Line
            'powershell.exe', 'cmd.exe', 'git-bash.exe', 'bash.exe', 'zsh.exe',
            // Development Runtimes
            'node.exe', 'python.exe', 'pythonw.exe', 'java.exe', 'javaw.exe', 'dotnet.exe',
            // Project Management
            'asana.exe', 'trello.exe', 'notion.exe', 'evernote.exe', 'todoist.exe',
            // File Sync/Cloud
            'onedrive.exe', 'dropbox.exe', 'googledrivefs.exe', 'icloud.exe',
            // Email Clients
            'thunderbird.exe', 'mailbird.exe',
            // IDEs and Editors
            'atom.exe', 'brackets.exe', 'vim.exe', 'emacs.exe', 'nano.exe',
            // Version Control
            'tortoisehg.exe', 'tortoisegit.exe', 'sourcetree.exe',
            // System Monitoring (user apps)
            'processhacker.exe', 'procexp.exe', 'procmon.exe', 'wireshark.exe'
        ]);

        // Define system processes that should be categorized as OS services
        const systemProcesses = new Set([
            'system idle process', 'system', 'secure system', 'registry', 'smss.exe',
            'csrss.exe', 'wininit.exe', 'services.exe', 'lsass.exe', 'winlogon.exe',
            'dwm.exe', 'explorer.exe', 'sihost.exe', 'taskhostw.exe', 'conhost.exe',
            'runtimebroker.exe', 'backgroundtaskhost.exe', 'dllhost.exe', 'wmiprvse.exe',
            'searchindexer.exe', 'searchhost.exe', 'searchprotocolhost.exe', 'searchfilterhost.exe',
            'startmenuexperiencehost.exe', 'shellExperiencehost.exe', 'applicationframehost.exe',
            'useroobebroker.exe', 'lockapp.exe', 'phoneexperiencehost.exe', 'textinputhost.exe',
            'widgets.exe', 'widgetservice.exe', 'ctfmon.exe', 'fontdrvhost.exe',
            'securityhealthservice.exe', 'securityhealthsystray.exe', 'mousocoreworker.exe',
            'aggregatorhost.exe', 'dataexchangehost.exe', 'crossdeviceservice.exe',
            'pushnotificationslongrunningtask.exe', 'filecoauth.exe', 'systemsettings.exe',
            'systemsettingsbroker.exe', 'winbox64.exe', 'dasHost.exe',
            // Services (these run as services)
            'svchost.exe', 'services.exe', 'lsass.exe', 'wininit.exe', 'csrss.exe',
            'spoolsv.exe', 'sqlwriter.exe', 'msmpeng.exe', 'nisSrv.exe', 'mpdefendercoreservice.exe',
            'nessus-service.exe', 'nessusd.exe', 'wslservice.exe', 'vmms.exe', 'vmcompute.exe',
            'vmwp.exe', 'vmmemWSL', 'wslrelay.exe', 'wslhost.exe', 'wsl.exe',
            'intelcphdcpsvc.exe', 'intelcphecisvc.exe', 'igfxcuiservice.exe', 'rtkauduservice64.exe',
            'oneapp.igcc.winService.exe', 'mysqld.exe', 'memory compression'
        ]);

        const summary = {
            total: processes.length,
            categories: {
                osServices: [],
                externalApps: [],
                otherProcesses: []
            },
            statistics: {
                byType: {},
                highCpu: [],
                highMemory: [],
                totalMemoryUsage: 0,
                averageMemoryPerProcess: 0
            }
        };

        let totalMemory = 0;
        let processCount = 0;

        processes.forEach(process => {
            const processName = (process.name || '').toLowerCase().trim();
            const memoryValue = this.parseMemoryValue(process.memory);

            // Categorize processes with improved logic
            if (systemProcesses.has(processName)) {
                summary.categories.osServices.push(process);
            } else if (knownExternalApps.has(processName) || this.isLikelyUserApplication(process)) {
                summary.categories.externalApps.push(process);
            } else {
                summary.categories.otherProcesses.push(process);
            }

            // Calculate memory statistics
            if (memoryValue > 0) {
                totalMemory += memoryValue;
                processCount++;
            }

            // Group by file extension or type
            const ext = path.extname(process.name || process.command || '').toLowerCase() || 'system';
            summary.statistics.byType[ext] = (summary.statistics.byType[ext] || 0) + 1;

            // Check for high CPU usage
            if (process.cpu > 10) {
                summary.statistics.highCpu.push(process);
            }

            // Check for high memory usage
            if (memoryValue > 100 * 1024) { // More than 100MB
                summary.statistics.highMemory.push(process);
            }
        });

        // Calculate memory statistics
        summary.statistics.totalMemoryUsage = totalMemory;
        summary.statistics.averageMemoryPerProcess = processCount > 0 ? Math.round(totalMemory / processCount) : 0;

        return summary;
    }

    /**
     * Check if a process is likely a user application using heuristic analysis
     */
    isLikelyUserApplication(process) {
        const processName = (process.name || '').toLowerCase().trim();

        // Skip if it's a known system process
        if (processName === '' || processName.length < 3) {
            return false;
        }

        // Skip Windows system processes
        if (processName.startsWith('system') ||
            processName.startsWith('secure') ||
            processName.startsWith('registry') ||
            processName.startsWith('memory')) {
            return false;
        }

        // Check for patterns that indicate user applications
        const userAppPatterns = [
            // Development and coding tools
            /code|cursor|vscode|webstorm|pycharm|intellij|eclipse|netbeans|sublime|atom|brackets/i,
            // Browsers and web
            /chrome|firefox|edge|safari|opera|brave/i,
            // Communication and chat
            /slack|teams|discord|skype|zoom|webex|chatgpt/i,
            // Office and productivity
            /word|excel|powerpoint|outlook|onenote|wps|libreoffice/i,
            // Media and entertainment
            /vlc|spotify|itunes|steam|epic|origin|battlenet/i,
            // Database tools
            /mysql|pgadmin|dbeaver|heidisql|datagrip/i,
            // Remote tools
            /putty|winscp|filezilla|mobaxterm|termius/i,
            // Virtualization
            /docker|vmware|virtualbox/i,
            // Design tools
            /photoshop|illustrator|indesign|gimp/i,
            // Project management
            /asana|trello|notion|evernote|todoist/i,
            // Cloud storage
            /dropbox|googledrive/i
        ];

        // Check for common application naming patterns
        const appNamePatterns = [
            // Ends with common app suffixes
            /workbench|studio|desktop|client|player|viewer|manager|admin/i,
            // Contains version numbers or common app words
            /\d+\.\d+/  // Version numbers like 1.0, 2023, etc.
        ];

        // Check if process is running in user session (not services)
        const isUserSession = process.session && (
            process.session.toLowerCase().includes('console') ||
            process.session.toLowerCase().includes('user') ||
            !process.session.toLowerCase().includes('services')
        );

        // Check memory usage - user apps typically use more memory
        const memoryValue = this.parseMemoryValue(process.memory);
        const hasReasonableMemory = memoryValue > 10 * 1024; // More than 10MB

        // Use multiple criteria for better detection
        const matchesPattern = userAppPatterns.some(pattern => pattern.test(processName));
        const matchesAppNaming = appNamePatterns.some(pattern => pattern.test(processName));
        const isExeFile = processName.endsWith('.exe');

        // Score-based detection
        let score = 0;
        if (matchesPattern) score += 3;
        if (matchesAppNaming) score += 2;
        if (isUserSession) score += 1;
        if (hasReasonableMemory) score += 1;
        if (isExeFile && processName.length > 6) score += 1; // Longer exe names are likely user apps

        // Consider it a user application if score is high enough
        return score >= 3;
    }

    /**
     * Parse memory value from string (e.g., "150,456 K" -> 150456)
     */
    parseMemoryValue(memoryStr) {
        if (!memoryStr || typeof memoryStr !== 'string') return 0;

        // Remove commas and extract number
        const cleanStr = memoryStr.replace(/,/g, '').replace(/[^\d.]/g, '');
        const value = parseFloat(cleanStr);

        if (memoryStr.toLowerCase().includes('k')) {
            return value; // Already in KB
        } else if (memoryStr.toLowerCase().includes('m')) {
            return value * 1024; // Convert MB to KB
        } else if (memoryStr.toLowerCase().includes('g')) {
            return value * 1024 * 1024; // Convert GB to KB
        }

        return value || 0;
    }

    /**
     * Filter processes to get only user-facing applications
     */
    filterUserApplications(processes) {
        const applications = [];

        processes.forEach(process => {
            const app = this.identifyApplication(process);
            if (app) {
                applications.push(app);
            }
        });

        // Remove duplicates (keep the one with highest memory usage)
        const uniqueApps = {};
        applications.forEach(app => {
            const key = app.name.toLowerCase();
            if (!uniqueApps[key] || this.parseMemoryValue(app.memory) > this.parseMemoryValue(uniqueApps[key].memory)) {
                uniqueApps[key] = app;
            }
        });

        return Object.values(uniqueApps);
    }

    /**
     * Identify if a process is a user-facing application
     */
    identifyApplication(process) {
        const processName = (process.name || '').toLowerCase().trim();

        // Skip system processes
        if (this.isSystemProcess(processName)) {
            return null;
        }

        // Define application categories and their identifiers
        const appCategories = {
            browsers: {
                patterns: ['chrome', 'brave', 'firefox', 'edge', 'opera', 'safari'],
                category: 'Browser'
            },
            development: {
                patterns: ['code', 'cursor', 'vscode', 'webstorm', 'pycharm', 'intellij', 'sublime', 'atom', 'eclipse'],
                category: 'Development'
            },
            communication: {
                patterns: ['slack', 'teams', 'discord', 'skype', 'zoom', 'webex', 'chatgpt'],
                category: 'Communication'
            },
            office: {
                patterns: ['word', 'excel', 'powerpoint', 'outlook', 'onenote', 'wps', 'libreoffice'],
                category: 'Office'
            },
            media: {
                patterns: ['vlc', 'spotify', 'itunes', 'photoshop', 'illustrator', 'premiere'],
                category: 'Media/Creative'
            },
            utilities: {
                patterns: ['docker', 'vmware', 'virtualbox', 'putty', 'winscp', 'filezilla'],
                category: 'Utilities'
            },
            database: {
                patterns: ['mysql', 'dbeaver', 'pgadmin', 'workbench'],
                category: 'Database'
            },
            other: {
                patterns: ['asana', 'notion', 'trello', 'steam', 'epic'],
                category: 'Other Apps'
            }
        };

        // Check if process matches any application category
        for (const [key, appType] of Object.entries(appCategories)) {
            if (appType.patterns.some(pattern => processName.includes(pattern))) {
                return {
                    name: process.name,
                    category: appType.category,
                    pid: process.pid,
                    memory: process.memory,
                    session: process.session,
                    platform: process.platform
                };
            }
        }

        // Check for generic application patterns
        if (this.isGenericApplication(process)) {
            return {
                name: process.name,
                category: 'Application',
                pid: process.pid,
                memory: process.memory,
                session: process.session,
                platform: process.platform
            };
        }

        return null;
    }

    /**
     * Check if a process name indicates a system process
     */
    isSystemProcess(processName) {
        const systemPatterns = [
            'system', 'svchost', 'csrss', 'wininit', 'services', 'lsass',
            'winlogon', 'dwm', 'sihost', 'taskhost', 'conhost', 'runtimebroker',
            'dllhost', 'wmiprvse', 'searchindexer', 'fontdrvhost', 'memory compression',
            'registry', 'smss', 'secure system', 'aggregatorhost', 'wmiprvse'
        ];

        return systemPatterns.some(pattern => processName.includes(pattern));
    }

    /**
     * Check if a process is likely a generic user application
     */
    isGenericApplication(process) {
        const processName = (process.name || '').toLowerCase();

        // Must be an .exe file
        if (!processName.endsWith('.exe')) {
            return false;
        }

        // Must run in user session
        if (process.session && process.session.toLowerCase().includes('services')) {
            return false;
        }


        // Must have reasonable process name length
        if (processName.length < 6 || processName.length > 50) {
            return false;
        }

        // Skip if it looks like a system process
        if (processName.includes('host') || processName.includes('service') || processName.includes('server')) {
            return false;
        }

        return true;
    }

    /**
     * Analyze the identified applications (simplified - just names and categories)
     */
    analyzeApplications(applications) {
        const analysis = {
            total: applications.length,
            categories: {},
            categorizedApps: {}
        };

        applications.forEach(app => {
            // Count by category
            analysis.categories[app.category] = (analysis.categories[app.category] || 0) + 1;

            // Group apps by category (just names)
            if (!analysis.categorizedApps[app.category]) {
                analysis.categorizedApps[app.category] = [];
            }
            analysis.categorizedApps[app.category].push(app.name);
        });

        return analysis;
    }

    /**
     * Save application report
     */
    async saveApplicationReport(applications, analysis) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const reportsDir = path.join(__dirname, '..', 'reports');

            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            // Save JSON report
            const jsonFilename = `app-report-${timestamp}.json`;
            const jsonFilepath = path.join(reportsDir, jsonFilename);

            const jsonReport = {
                timestamp: new Date().toISOString(),
                platform: this.platform,
                summary: {
                    totalApplications: analysis.total,
                    categories: analysis.categories
                },
                applications: analysis.categorizedApps
            };

            fs.writeFileSync(jsonFilepath, JSON.stringify(jsonReport, null, 2), 'utf8');

            // Save text report
            const txtFilename = `app-report-${timestamp}.txt`;
            const txtFilepath = path.join(reportsDir, txtFilename);

            let reportContent = `Application Report - ${new Date().toLocaleString()}\n`;
            reportContent += `Platform: ${this.platform}\n`;
            reportContent += `Total Running Applications: ${analysis.total}\n\n`;

            reportContent += 'APPLICATIONS BY CATEGORY:\n';
            reportContent += '='.repeat(50) + '\n';

            Object.entries(analysis.categories).forEach(([category, count]) => {
                reportContent += `${category}: ${count} apps\n`;
            });

            reportContent += '\nRUNNING APPLICATIONS:\n';
            reportContent += '='.repeat(50) + '\n';

            Object.entries(analysis.categorizedApps).forEach(([category, apps]) => {
                reportContent += `\n${category.toUpperCase()}:\n`;
                apps.forEach(app => {
                    reportContent += `  • ${app}\n`;
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
                applicationCount: analysis.total
            };

        } catch (error) {
            console.error('Error saving application report:', error);
            throw error;
        }
    }

    /**
     * Main function to monitor applications and create report
     */
    async monitorAndReport() {
        try {
            console.log('Starting application monitoring...');

            const allProcesses = await this.getRunningProcesses();
            const userApplications = this.filterUserApplications(allProcesses);
            const appSummary = this.analyzeApplications(userApplications);
            const reportResult = await this.saveApplicationReport(userApplications, appSummary);

            console.log(`Found ${allProcesses.length} total processes`);
            console.log(`Identified ${userApplications.length} user applications`);
            console.log('Application report saved:', reportResult.textFile.filepath);

            // Create formatted JSON output
            const formattedReport = {
                timestamp: new Date().toISOString(),
                platform: this.platform,
                overview: {
                    totalProcesses: allProcesses.length,
                    runningApplications: userApplications.length,
                    applicationCategories: appSummary.categories
                },
                applications: {
                    byCategory: appSummary.categorizedApps,
                    allApplications: userApplications.map(app => ({
                        name: app.name,
                        category: app.category
                    }))
                },
                files: {
                    jsonReport: reportResult.jsonFile.filename,
                    textReport: reportResult.textFile.filename
                }
            };

            return {
                processes: allProcesses,
                applications: userApplications,
                summary: appSummary,
                report: reportResult,
                formattedReport: formattedReport
            };

        } catch (error) {
            console.error('Application monitoring failed:', error);
            throw error;
        }
    }
}

module.exports = ProcessMonitor;
