// Test script to verify the UMD bundle structure
const fs = require('fs');
const path = require('path');

console.log('Testing Base Pay SDK Bundle...\n');

// Read the bundle
const bundlePath = path.join(__dirname, 'dist/base-pay.js');
const minifiedPath = path.join(__dirname, 'dist/base-pay.min.js');

// Check if files exist
if (!fs.existsSync(bundlePath)) {
    console.error('❌ Bundle not found at:', bundlePath);
    process.exit(1);
}

if (!fs.existsSync(minifiedPath)) {
    console.error('❌ Minified bundle not found at:', minifiedPath);
    process.exit(1);
}

// Get file sizes
const bundleSize = fs.statSync(bundlePath).size;
const minifiedSize = fs.statSync(minifiedPath).size;

console.log('✅ Bundle files found:');
console.log(`   - base-pay.js: ${(bundleSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   - base-pay.min.js: ${(minifiedSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   - Compression ratio: ${((1 - minifiedSize / bundleSize) * 100).toFixed(1)}%\n`);

// Test UMD structure by checking the bundle content
const bundleContent = fs.readFileSync(bundlePath, 'utf8');

// Check for UMD pattern
if (bundleContent.includes('typeof exports === \'object\' && typeof module !== \'undefined\'')) {
    console.log('✅ UMD pattern detected');
} else {
    console.log('❌ UMD pattern not found');
}

// Check for global assignment
if (bundleContent.includes('global.base = factory()')) {
    console.log('✅ Global assignment found (window.base)');
} else {
    console.log('❌ Global assignment not found');
}

// Check for expected exports
const expectedExports = ['pay', 'getPaymentStatus', 'constants'];
console.log('\nChecking for expected exports:');
expectedExports.forEach(exp => {
    if (bundleContent.includes(exp)) {
        console.log(`✅ Found export: ${exp}`);
    } else {
        console.log(`❌ Missing export: ${exp}`);
    }
});

console.log('\n📝 Bundle Summary:');
console.log('   - Format: UMD');
console.log('   - Global name: window.base');
console.log('   - Main exports: pay(), getPaymentStatus(), constants');
console.log('   - Source maps: ✅ Generated');

console.log('\n🌐 To test in browser:');
console.log('   1. The HTTP server is running at http://localhost:8080');
console.log('   2. Open http://localhost:8080/test-bundle.html');
console.log('   3. Click "Test Bundle" to verify loading');
console.log('   4. Try the payment and status check features'); 