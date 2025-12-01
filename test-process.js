// Quick test script for process monitoring
const ProcessMonitor = require('./src/js/process-monitor');

async function testProcessMonitoring() {
    console.log('🧪 Testing Process Monitoring...\n');

    try {
        const monitor = new ProcessMonitor();

        console.log('Getting running processes...');
        const processes = await monitor.getRunningProcesses();

        console.log(`Found ${processes.length} processes\n`);

        // Check for target applications
        const targetApps = ['docker', 'code', 'cursor', 'chatgpt', 'brave', 'edge', 'asana', 'slack', 'vscode', 'chrome'];
        const foundApps = processes.filter(p =>
            targetApps.some(app => p.name.toLowerCase().includes(app.toLowerCase()))
        );

        console.log('🎯 Target Applications Check:');
        console.log('Looking for:', targetApps.join(', '));
        console.log('\nFound applications:');
        if (foundApps.length > 0) {
            foundApps.forEach(app => {
                console.log(`✅ ${app.name} (PID: ${app.pid}, Memory: ${app.memory}, Session: ${app.session})`);
            });
        } else {
            console.log('❌ No target applications found');
        }

        console.log('\n📊 Sample of first 10 processes:');
        processes.slice(0, 10).forEach((p, i) => {
            console.log(`${i + 1}. ${p.name} (PID: ${p.pid})`);
        });

        // Test categorization
        console.log('\n🏷️ Testing categorization...');
        const summary = monitor.getProcessSummary(processes);

        console.log(`OS Services: ${summary.categories.osServices.length}`);
        console.log(`External Apps: ${summary.categories.externalApps.length}`);
        console.log(`Other Processes: ${summary.categories.otherProcesses.length}`);

        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testProcessMonitoring();
