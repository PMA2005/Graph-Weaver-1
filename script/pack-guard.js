#!/usr/bin/env node

const targetPlatform = process.argv[2];
const currentPlatform = process.platform;

if (targetPlatform === 'mac' && currentPlatform !== 'darwin') {
  console.error('\n❌ ERROR: macOS builds must be created on macOS');
  console.error('Current platform:', currentPlatform);
  console.error('\nReason: better-sqlite3 native module requires per-OS builds');
  console.error('Solution: Run this script on a Mac\n');
  process.exit(1);
}

if (targetPlatform === 'win' && currentPlatform !== 'win32') {
  console.error('\n❌ ERROR: Windows builds must be created on Windows');
  console.error('Current platform:', currentPlatform);
  console.error('\nReason: better-sqlite3 native module requires per-OS builds');
  console.error('Solution: Run this script on a Windows machine\n');
  process.exit(1);
}

console.log(`✅ Platform check passed: Building for ${targetPlatform} on ${currentPlatform}`);
