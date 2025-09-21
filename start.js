#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🌊 Driftway Startup Script');
console.log('==========================');
console.log('Starting both API server and Web client...\n');

// Path configurations
const rootDir = path.dirname(__filename);
const clientDir = path.join(rootDir, 'client');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorLog(color, prefix, message) {
    console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

// Function to start a process
function startProcess(name, command, args, cwd, color) {
    const proc = spawn(command, args, {
        cwd: cwd,
        stdio: 'pipe',
        shell: true
    });

    proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        lines.forEach(line => {
            colorLog(color, name, line);
        });
    });

    proc.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        lines.forEach(line => {
            colorLog(colors.red, `${name} ERR`, line);
        });
    });

    proc.on('close', (code) => {
        if (code !== 0) {
            colorLog(colors.red, name, `Process exited with code ${code}`);
        } else {
            colorLog(colors.green, name, 'Process exited successfully');
        }
    });

    proc.on('error', (err) => {
        colorLog(colors.red, name, `Failed to start: ${err.message}`);
    });

    return proc;
}

// Check if dependencies are installed
function checkDependencies() {
    const fs = require('fs');
    
    const rootNodeModules = path.join(rootDir, 'node_modules');
    const clientNodeModules = path.join(clientDir, 'node_modules');
    
    if (!fs.existsSync(rootNodeModules)) {
        colorLog(colors.yellow, 'SETUP', 'Installing API server dependencies...');
        const npmInstall = spawn('npm', ['install'], { cwd: rootDir, stdio: 'inherit', shell: true });
        
        npmInstall.on('close', (code) => {
            if (code === 0) {
                checkClientDependencies();
            } else {
                colorLog(colors.red, 'ERROR', 'Failed to install API dependencies');
                process.exit(1);
            }
        });
    } else {
        checkClientDependencies();
    }
    
    function checkClientDependencies() {
        if (!fs.existsSync(clientNodeModules)) {
            colorLog(colors.yellow, 'SETUP', 'Installing client server dependencies...');
            const npmInstall = spawn('npm', ['install'], { cwd: clientDir, stdio: 'inherit', shell: true });
            
            npmInstall.on('close', (code) => {
                if (code === 0) {
                    startServers();
                } else {
                    colorLog(colors.red, 'ERROR', 'Failed to install client dependencies');
                    process.exit(1);
                }
            });
        } else {
            startServers();
        }
    }
}

// Start both servers
function startServers() {
    colorLog(colors.green, 'STARTUP', 'Dependencies ready! Starting servers...\n');
    
    // Start API server (backend)
    colorLog(colors.blue, 'API', 'Starting Driftway API server on port 3000...');
    const apiServer = startProcess('API', 'npm', ['run', 'dev'], rootDir, colors.blue);
    
    // Declare clientServer variable
    let clientServer;
    
    // Wait a moment then start client server
    setTimeout(() => {
        colorLog(colors.magenta, 'CLIENT', 'Starting Driftway client server on port 4522...');
        clientServer = startProcess('CLIENT', 'node', ['server.js'], clientDir, colors.magenta);
        
        // Wait for both servers to start, then show access info
        setTimeout(() => {
            console.log('\n' + '='.repeat(60));
            console.log('🎉 Driftway is now running!');
            console.log('='.repeat(60));
            console.log('');
            console.log('📡 API Server:    http://localhost:3000');
            console.log('📱 Web Client:    http://localhost:4522');
            console.log('');
            console.log('🌐 Open your browser and go to: http://localhost:4522');
            console.log('');
            console.log('💡 Tips:');
            console.log('   • Use existing sample users or create a new one');
            console.log('   • Real-time messaging with WebSocket support');
            console.log('   • Discord-like interface for easy chatting');
            console.log('');
            console.log('🛑 Press Ctrl+C to stop both servers');
            console.log('='.repeat(60));
            console.log('');
        }, 3000);
        
    }, 2000);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Driftway...');
        
        if (apiServer) {
            colorLog(colors.blue, 'API', 'Stopping API server...');
            apiServer.kill('SIGTERM');
        }
        
        if (clientServer) {
            colorLog(colors.magenta, 'CLIENT', 'Stopping client server...');
            clientServer.kill('SIGTERM');
        }
        
        setTimeout(() => {
            console.log('👋 Driftway stopped. Goodbye!');
            process.exit(0);
        }, 1000);
    });
    
    process.on('SIGTERM', () => {
        process.emit('SIGINT');
    });
}

// Start the setup process
checkDependencies();