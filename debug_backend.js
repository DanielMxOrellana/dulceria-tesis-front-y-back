const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = fs.createWriteStream(path.join(__dirname, 'backend_debug.log'), { flags: 'a' });

console.log("Starting backend in debug mode...");
logFile.write(`--- Starting Debug Session: ${new Date().toISOString()} ---\n`);

const child = spawn('node', ['src/index.js'], {
    cwd: path.join(__dirname, 'backend'),
    env: process.env,
    shell: true
});

child.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);
    logFile.write(output);
});

child.stderr.on('data', (data) => {
    const output = data.toString();
    process.stderr.write(output);
    logFile.write(`ERROR: ${output}`);
});

child.on('close', (code) => {
    const msg = `Backend process exited with code ${code}\n`;
    console.log(msg);
    logFile.write(msg);
});
