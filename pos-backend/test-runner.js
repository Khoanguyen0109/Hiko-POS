#!/usr/bin/env node

/**
 * Test Runner Script
 * 
 * This script helps you run different types of tests easily
 */

const { spawn } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    log('cyan', `\n🚀 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        log('green', `✅ Command completed successfully`);
        resolve(code);
      } else {
        log('red', `❌ Command failed with exit code ${code}`);
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      log('red', `❌ Command error: ${error.message}`);
      reject(error);
    });
  });
}

async function runTests() {
  const testType = process.argv[2] || 'all';
  
  log('bright', '🧪 POS Backend Test Runner');
  log('bright', '=' .repeat(40));
  
  try {
    switch (testType) {
      case 'unit':
        log('blue', '📋 Running Unit Tests (Order Controller & Promotion Service)');
        await runCommand('npm', ['test', '--', '--testPathPatterns=orderController|promotionService']);
        break;
        
      case 'integration':
        log('blue', '🔗 Running Integration Tests');
        await runCommand('npm', ['test', '--', '--testPathPatterns=integration']);
        break;
        
      case 'coverage':
        log('blue', '📊 Running Tests with Coverage Report');
        await runCommand('npm', ['run', 'test:coverage']);
        break;
        
      case 'watch':
        log('blue', '👀 Running Tests in Watch Mode');
        await runCommand('npm', ['run', 'test:watch']);
        break;
        
      case 'order':
        log('blue', '📦 Running Order Controller Tests Only');
        await runCommand('npm', ['test', '--', '--testPathPatterns=orderController']);
        break;
        
      case 'promotion':
        log('blue', '🎯 Running Promotion Service Tests Only');
        await runCommand('npm', ['test', '--', '--testPathPatterns=promotionService']);
        break;
        
      case 'all':
      default:
        log('blue', '🎯 Running All Tests');
        await runCommand('npm', ['test']);
        break;
    }
    
    log('green', '\n🎉 Test run completed successfully!');
    
  } catch (error) {
    log('red', '\n💥 Test run failed!');
    log('red', error.message);
    process.exit(1);
  }
}

// Show usage if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('bright', '🧪 POS Backend Test Runner');
  log('bright', '=' .repeat(40));
  console.log('');
  log('cyan', 'Usage: node test-runner.js [test-type]');
  console.log('');
  log('yellow', 'Test Types:');
  console.log('  all         - Run all tests (default)');
  console.log('  unit        - Run unit tests only');
  console.log('  integration - Run integration tests only');
  console.log('  order       - Run order controller tests only');
  console.log('  promotion   - Run promotion service tests only');
  console.log('  coverage    - Run tests with coverage report');
  console.log('  watch       - Run tests in watch mode');
  console.log('');
  log('yellow', 'Examples:');
  console.log('  node test-runner.js');
  console.log('  node test-runner.js unit');
  console.log('  node test-runner.js coverage');
  console.log('  node test-runner.js watch');
  console.log('');
  process.exit(0);
}

// Run the tests
runTests();


