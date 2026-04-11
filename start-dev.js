const { spawn } = require('child_process');

console.log('🚀 Starting Taxihouse Development Environment...');

// Start Local API
const api = spawn('node', ['local-api.js'], { 
  stdio: 'inherit' 
});

// Start Frontend
const client = spawn('npm', ['run', 'dev', '--prefix', 'client'], { 
  stdio: 'inherit', 
  shell: true 
});

// Handle termination of both processes
process.on('SIGINT', () => {
  console.log('\n👋 Closing everything...');
  api.kill();
  client.kill();
  process.exit();
});

api.on('exit', (code) => {
  if (code !== 0) {
    console.error(`API process exited with code ${code}`);
    client.kill();
    process.exit(code);
  }
});

client.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Client process exited with code ${code}`);
    api.kill();
    process.exit(code);
  }
});
