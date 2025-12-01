// Dashboard page functionality for DreamHRAi

class DashboardManager {
    constructor() {
        this.init();
    }

    init() {
        // Navigation elements
        const dashboardNav = document.getElementById('dashboardNav');
        const historyNav = document.getElementById('historyNav');
        const tasksNav = document.getElementById('tasksNav');

        // Page elements
        const dashboardPage = document.getElementById('dashboardPage');
        const historyPage = document.getElementById('historyPage');
        const tasksPage = document.getElementById('tasksPage');

        // Dashboard elements
        const dashboardBtn = document.getElementById('dashboardBtn');
        const timeButtons = document.getElementById('timeButtons');
        const timeInBtn = document.getElementById('timeInBtn');
        const timeOutBtn = document.getElementById('timeOutBtn');
        const breakInBtn = document.getElementById('breakInBtn');
        const breakOutBtn = document.getElementById('breakOutBtn');

        let isDashboardOpen = false;

        // Navigation event listeners
        if (dashboardNav) dashboardNav.addEventListener('click', () => this.switchPage('dashboard'));
        if (historyNav) historyNav.addEventListener('click', () => this.switchPage('history'));
        if (tasksNav) tasksNav.addEventListener('click', () => this.switchPage('tasks'));

        // Dashboard button click handler
        if (dashboardBtn) {
            console.log('Dashboard button found:', dashboardBtn);
            dashboardBtn.addEventListener('click', () => {
                console.log('Dashboard button clicked, isDashboardOpen:', isDashboardOpen);
                if (isDashboardOpen) {
                    // Hide time buttons
                    timeButtons.style.display = 'none';
                    dashboardBtn.textContent = 'Show Time Tracking';
                    isDashboardOpen = false;
                    console.log('Time buttons hidden');
                } else {
                    // Show time buttons
                    timeButtons.style.display = 'grid';
                    dashboardBtn.textContent = 'Hide Time Tracking';
                    isDashboardOpen = true;
                    console.log('Time buttons shown');
                }
            });
        } else {
            console.log('Dashboard button not found!');
        }

        // Time tracking button handlers
        if (timeInBtn) timeInBtn.addEventListener('click', () => this.handleTimeAction('time-in'));
        if (timeOutBtn) timeOutBtn.addEventListener('click', () => this.handleTimeAction('time-out'));
        if (breakInBtn) breakInBtn.addEventListener('click', () => this.handleTimeAction('break-in'));
        if (breakOutBtn) breakOutBtn.addEventListener('click', () => this.handleTimeAction('break-out'));

        // Load History Page
        this.loadHistoryPage = function() {
            const historyContent = document.getElementById('historyContent');
            if (historyContent) {
                historyContent.innerHTML = `
                    <div class="history-container">
                        <div class="history-header">
                            <h3>Time Tracking History</h3>
                            <div class="filter-controls">
                                <select id="historyFilter">
                                    <option value="all">All Records</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                </select>
                            </div>
                        </div>
                        <div class="history-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Action</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="historyTableBody">
                                    <tr>
                                        <td colspan="4" style="text-align: center; padding: 20px;">
                                            <em>No time tracking records found</em>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;

                // Add filter functionality
                const historyFilter = document.getElementById('historyFilter');
                if (historyFilter) {
                    historyFilter.addEventListener('change', function(e) {
                        this.filterHistory(e.target.value);
                    }.bind(this));
                }
            }
        };

        // Load Tasks Page
        this.loadTasksPage = function() {
            const tasksContent = document.getElementById('tasksContent');
            if (tasksContent) {
                tasksContent.innerHTML = `
                    <div class="tasks-container">
                        <div class="tasks-header">
                            <h3>Task Management</h3>
                            <button class="add-task-btn" id="addTaskBtn">+ Add New Task</button>
                        </div>
                        <div class="tasks-list" id="tasksList">
                            <div class="no-tasks">
                                <em>No tasks found. Click "Add New Task" to create one.</em>
                            </div>
                        </div>
                    </div>
                `;

                // Add task button functionality
                const addTaskBtn = document.getElementById('addTaskBtn');
                if (addTaskBtn) {
                    addTaskBtn.addEventListener('click', () => this.showAddTaskModal());
                }
            }
        };
    }

    switchPage(pageName) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

        // Load the appropriate HTML file
        switch(pageName) {
            case 'dashboard':
                const dashboardNav = document.getElementById('dashboardNav');
                if (dashboardNav) dashboardNav.classList.add('active');
                // Dashboard is already loaded (index.html)
                break;
            case 'history':
                const historyNav = document.getElementById('historyNav');
                if (historyNav) historyNav.classList.add('active');
                window.location.href = 'history.html';
                break;
            case 'tasks':
                const tasksNav = document.getElementById('tasksNav');
                if (tasksNav) tasksNav.classList.add('active');
                window.location.href = 'tasks.html';
                break;
        }
    }

    async handleTimeAction(action) {
        const messages = {
            'time-in': '⏰ Time In recorded successfully!',
            'time-out': '⏱️ Time Out recorded successfully!',
            'break-in': '☕ Break In recorded successfully!',
            'break-out': '🏃 Break Out recorded successfully!'
        };

        const buttonIds = {
            'time-in': 'timeInBtn',
            'time-out': 'timeOutBtn',
            'break-in': 'breakInBtn',
            'break-out': 'breakOutBtn'
        };

        // Handle different actions
        if (action === 'time-in') {
            // Time In: Take screenshot and monitor running processes
            console.log('Taking screenshot and monitoring processes for Time In...');

            try {
                // Take screenshot first
                const screenshotResult = await window.electronAPI.takeScreenshot();
                if (screenshotResult.success) {
                    console.log('Screenshot saved:', screenshotResult.filepath);
                } else {
                    console.error('Screenshot failed:', screenshotResult.error);
                }

                // Monitor running applications
                console.log('Monitoring running applications...');
                const processResult = await window.electronAPI.monitorProcesses();

                // Monitor Chrome browser history for today (Asia/Dhaka timezone)
                console.log('Monitoring Chrome browser history for today...');
                const chromeResult = await window.electronAPI.monitorChromeHistory();

                if (processResult.success) {
                    const { applications, formattedReport, report } = processResult.data;

                    // Handle Chrome history results
                    let chromeVisits = 0;
                    if (chromeResult && chromeResult.success) {
                        const { data: chromeData } = chromeResult;
                        chromeVisits = chromeData.filteredHistory || 0;
                        console.log(`📊 Chrome History Results:`);
                        console.log(`Total browser visits found: ${chromeData.totalHistory || 0}`);
                        console.log(`Today's visits: ${chromeVisits}`);
                        console.log(`Chrome report saved: ${chromeData.report?.textFile?.filename || 'N/A'}`);
                    }

                    // Check for specific apps the user mentioned
                    const targetApps = ['docker', 'code', 'chatgpt', 'brave', 'edge', 'asana', 'slack', 'cursor', 'vscode'];
                    const foundApps = applications.filter(app =>
                        targetApps.some(target => app.name.toLowerCase().includes(target.toLowerCase()))
                    );

                    console.group('🎯 Target Applications Check');
                    console.log('Looking for:', targetApps.join(', '));
                    console.log('Found applications:');
                    if (foundApps.length > 0) {
                        foundApps.forEach(app => {
                            console.log(`✅ ${app.name} (${app.category})`);
                        });
                    } else {
                        console.log('❌ No target applications found');
                    }
                    console.groupEnd();

                    // Log summary
                    console.group('📊 Application Summary');
                    console.log(`Total Processes: ${formattedReport.overview.totalProcesses}`);
                    console.log(`Running Applications: ${formattedReport.overview.runningApplications}`);
                    console.log(`Reports saved: ${report.textFile.filename}, ${report.jsonFile.filename}`);
                    console.groupEnd();

                    // Log applications by category
                    console.group('📂 Applications by Category');
                    Object.entries(formattedReport.overview.applicationCategories).forEach(([category, count]) => {
                        console.log(`${category}: ${count} apps`);
                        // List the apps in this category
                        const categoryApps = formattedReport.applications.byCategory[category];
                        categoryApps.forEach(appName => {
                            console.log(`  • ${appName}`);
                        });
                    });
                    console.groupEnd();

                    // Log all running applications
                    console.group('📋 All Running Applications');
                    applications.forEach((app, index) => {
                        console.log(`${index + 1}. ${app.name} (${app.category})`);
                    });
                    console.groupEnd();

                    // Show notification with application and browsing data
                    this.showNotification(
                        `Time In recorded! ${formattedReport.overview.runningApplications} apps running, ${chromeVisits} today's browser visits logged.`,
                        'success'
                    );
                } else {
                    console.error('Process monitoring failed');
                    this.showNotification('Time In recorded, but process monitoring failed.', 'warning');
                }

                // Handle Chrome history monitoring errors gracefully
                if (!chromeResult || !chromeResult.success) {
                    console.warn('Chrome history monitoring failed or Chrome not available');
                    console.log('Note: Chrome history monitoring requires Chrome browser to be installed');
                }

            } catch (error) {
                console.error('Time In error:', error);
                this.showNotification('Time In recorded, but some operations failed.', 'warning');
            }
        } else if (action === 'time-out') {
            // Time Out: Reset background and change only button color
            document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            const button = document.getElementById(buttonIds[action]);
            if (button) {
                button.classList.add('success');
                setTimeout(() => {
                    button.classList.remove('success');
                }, 3000); // Keep green longer for Time Out
            }
        } else {
            // Break In/Out: Normal button behavior
            const button = document.getElementById(buttonIds[action]);
            if (button) {
                button.classList.add('success');
                setTimeout(() => {
                    button.classList.remove('success');
                }, 2000);
            }
        }

        // Show notification (except for time-in which shows screenshot notification)
        if (action !== 'time-in') {
            this.showNotification(messages[action], 'success');
        }
    }



    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(46, 204, 113, 0.95)' : 'rgba(102, 126, 234, 0.95)'};
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    filterHistory(filter) {
        // This would normally filter actual data
        const tbody = document.getElementById('historyTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;"><em>Loading filtered results...</em></td></tr>';

            setTimeout(() => {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;"><em>No records found for selected filter</em></td></tr>';
            }, 500);
        }
    }

    showAddTaskModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Add New Task</h3>
                <form id="addTaskForm">
                    <div class="form-group">
                        <label>Task Name:</label>
                        <input type="text" id="taskName" required>
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <textarea id="taskDesc" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Priority:</label>
                        <select id="taskPriority">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit">Create Task</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const addTaskForm = document.getElementById('addTaskForm');
        if (addTaskForm) {
            addTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Handle task creation here
                modal.remove();
                this.showNotification('Task created successfully!', 'success');
            });
        }
    }
}

// Add CSS animation for notifications
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    .notification-content {
        text-align: center;
    }
    .notification-content p {
        margin-bottom: 15px;
        font-size: 16px;
        font-weight: 500;
    }
    .notification-content button {
        padding: 8px 16px;
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: 5px;
        color: white;
        cursor: pointer;
        font-size: 14px;
    }
    .notification-content button:hover {
        background: rgba(255,255,255,0.3);
    }
`;
document.head.appendChild(notificationStyle);

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});
