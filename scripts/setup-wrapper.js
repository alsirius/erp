#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Siriux Premium WebApp Starter Setup');
console.log('==========================================');

// Get project name from command line arguments
const projectName = process.argv[2];

if (!projectName) {
    console.error('❌ Project name is required.');
    console.error('Usage: npm run setup <project-name>');
    process.exit(1);
}

console.log(`📁 Setting up project: ${projectName}`);

// Run the setup script with the project name
const setupScript = path.join(__dirname, 'setup.sh');
const child = spawn('bash', [setupScript, projectName], {
    stdio: 'inherit',
    shell: true
});

child.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ Setup completed successfully!');
        console.log(`📁 Project created in: ./${projectName}/`);
        console.log('\n🎯 Next steps:');
        console.log(`1. cd ${projectName}`);
        console.log('2. Update .env with your configuration');
        console.log('3. Run ./dev.sh to start development');
        console.log('4. Open http://localhost:3000 to view your app');
    } else {
        console.error(`❌ Setup failed with exit code: ${code}`);
        process.exit(code);
    }
});
