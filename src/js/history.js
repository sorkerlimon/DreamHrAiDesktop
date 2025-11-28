// History page functionality for DreamHRAi

class HistoryManager {
    constructor() {
        this.records = [];
        this.filteredRecords = [];
        this.init();
    }

    init() {
        this.loadSampleData();
        this.setupEventListeners();
        this.updateStats();
        this.renderTable();
    }

    loadSampleData() {
        // Generate sample time tracking data
        const today = new Date();
        this.records = [];

        // Generate records for the past 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // Add time in/out records
            if (Math.random() > 0.2) { // 80% chance of having records for a day
                const timeIn = new Date(date);
                timeIn.setHours(9, Math.floor(Math.random() * 60), 0);

                const timeOut = new Date(date);
                timeOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);

                this.records.push({
                    id: this.records.length + 1,
                    date: date.toISOString().split('T')[0],
                    time: timeIn.toTimeString().split(' ')[0],
                    action: 'Time In',
                    duration: null,
                    status: 'time-in',
                    timestamp: timeIn.getTime()
                });

                this.records.push({
                    id: this.records.length + 1,
                    date: date.toISOString().split('T')[0],
                    time: timeOut.toTimeString().split(' ')[0],
                    action: 'Time Out',
                    duration: this.calculateDuration(timeIn, timeOut),
                    status: 'time-out',
                    timestamp: timeOut.getTime()
                });

                // Add break records (50% chance)
                if (Math.random() > 0.5) {
                    const breakIn = new Date(date);
                    breakIn.setHours(12, Math.floor(Math.random() * 60), 0);

                    const breakOut = new Date(date);
                    breakOut.setHours(13, Math.floor(Math.random() * 60), 0);

                    this.records.push({
                        id: this.records.length + 1,
                        date: date.toISOString().split('T')[0],
                        time: breakIn.toTimeString().split(' ')[0],
                        action: 'Break In',
                        duration: null,
                        status: 'break-in',
                        timestamp: breakIn.getTime()
                    });

                    this.records.push({
                        id: this.records.length + 1,
                        date: date.toISOString().split('T')[0],
                        time: breakOut.toTimeString().split(' ')[0],
                        action: 'Break Out',
                        duration: this.calculateDuration(breakIn, breakOut),
                        status: 'break-out',
                        timestamp: breakOut.getTime()
                    });
                }
            }
        }

        // Sort records by timestamp (newest first)
        this.records.sort((a, b) => b.timestamp - a.timestamp);
        this.filteredRecords = [...this.records];
    }

    calculateDuration(startTime, endTime) {
        const diff = endTime - startTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    setupEventListeners() {
        document.getElementById('dateFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('actionFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('applyFilters').addEventListener('click', () => this.applyFilters());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());

        // Show/hide custom date inputs
        document.getElementById('dateFilter').addEventListener('change', function(e) {
            const customDateGroup = document.querySelectorAll('.filter-group')[2]; // From date
            const toDateGroup = document.querySelectorAll('.filter-group')[3]; // To date

            if (e.target.value === 'custom') {
                customDateGroup.style.display = 'block';
                toDateGroup.style.display = 'block';
            } else {
                customDateGroup.style.display = 'none';
                toDateGroup.style.display = 'none';
            }
        });
    }

    applyFilters() {
        const dateFilter = document.getElementById('dateFilter').value;
        const actionFilter = document.getElementById('actionFilter').value;
        const fromDate = document.getElementById('fromDate').value;
        const toDate = document.getElementById('toDate').value;

        this.filteredRecords = this.records.filter(record => {
            // Date filter
            let dateMatch = true;
            if (dateFilter !== 'all') {
                const recordDate = new Date(record.date);
                const today = new Date();

                switch (dateFilter) {
                    case 'today':
                        dateMatch = recordDate.toDateString() === today.toDateString();
                        break;
                    case 'week':
                        const weekAgo = new Date(today);
                        weekAgo.setDate(today.getDate() - 7);
                        dateMatch = recordDate >= weekAgo;
                        break;
                    case 'month':
                        const monthAgo = new Date(today);
                        monthAgo.setMonth(today.getMonth() - 1);
                        dateMatch = recordDate >= monthAgo;
                        break;
                    case 'custom':
                        if (fromDate && toDate) {
                            const from = new Date(fromDate);
                            const to = new Date(toDate);
                            dateMatch = recordDate >= from && recordDate <= to;
                        }
                        break;
                }
            }

            // Action filter
            let actionMatch = true;
            if (actionFilter !== 'all') {
                const actionMap = {
                    'time-in': 'Time In',
                    'time-out': 'Time Out',
                    'break-in': 'Break In',
                    'break-out': 'Break Out'
                };
                actionMatch = record.action === actionMap[actionFilter];
            }

            return dateMatch && actionMatch;
        });

        this.updateStats();
        this.renderTable();
    }

    updateStats() {
        const totalRecords = this.filteredRecords.length;

        // Calculate total hours (simplified)
        let totalMinutes = 0;
        this.filteredRecords.forEach(record => {
            if (record.duration) {
                const match = record.duration.match(/(\d+)h\s*(\d+)m/);
                if (match) {
                    totalMinutes += parseInt(match[1]) * 60 + parseInt(match[2]);
                } else {
                    const minMatch = record.duration.match(/(\d+)m/);
                    if (minMatch) {
                        totalMinutes += parseInt(minMatch[1]);
                    }
                }
            }
        });

        const totalHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;

        // Calculate average break time
        const breakRecords = this.filteredRecords.filter(r => r.action.includes('Break'));
        const avgBreakMinutes = breakRecords.length > 0 ?
            Math.round(totalMinutes / breakRecords.length) : 0;

        // Calculate efficiency (simplified)
        const workRecords = this.filteredRecords.filter(r => r.action.includes('Time'));
        const efficiency = workRecords.length > 0 ?
            Math.round((totalMinutes / (workRecords.length * 480)) * 100) : 0; // Assuming 8 hours = 480 minutes

        document.getElementById('totalRecords').textContent = totalRecords;
        document.getElementById('totalHours').textContent = totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : '0h';
        document.getElementById('avgBreakTime').textContent = `${avgBreakMinutes}m`;
        document.getElementById('efficiencyRate').textContent = `${Math.min(efficiency, 100)}%`;
    }

    renderTable() {
        const tbody = document.getElementById('historyTableBody');

        if (this.filteredRecords.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data">
                        <em>No records found matching your filters</em>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredRecords.map(record => `
            <tr>
                <td>${this.formatDate(record.date)}</td>
                <td>${record.time}</td>
                <td>${record.action}</td>
                <td>${record.duration || '-'}</td>
                <td><span class="status-badge status-${record.status.replace(' ', '-')}">${record.status.replace('-', ' ')}</span></td>
            </tr>
        `).join('');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    exportData() {
        // Create CSV content
        let csv = 'Date,Time,Action,Duration,Status\n';

        this.filteredRecords.forEach(record => {
            csv += `${record.date},${record.time},${record.action},${record.duration || ''},${record.status}\n`;
        });

        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `time-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showNotification('Data exported successfully!', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(46, 204, 113, 0.95)' : 'rgba(102, 126, 234, 0.95)'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HistoryManager();
});
