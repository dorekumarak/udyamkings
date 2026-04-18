const fs = require('fs-extra');
const path = require('path');

// Create directories if they don't exist
const cssDir = path.join(__dirname, 'public/css');
const webfontsDir = path.join(__dirname, 'public/webfonts');

fs.ensureDirSync(cssDir);
fs.ensureDirSync(webfontsDir);

// Function to safely copy files
const safeCopy = (src, dest) => {
  try {
    if (fs.existsSync(src)) {
      fs.copySync(src, dest);
      console.log(`✅ Copied ${path.basename(src)}`);
    } else {
      console.warn(`⚠️  Source file not found: ${src}`);
    }
  } catch (error) {
    console.error(`❌ Error copying ${path.basename(src)}:`, error.message);
  }
};

// Copy Font Awesome files
const fontAwesomeCSS = path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/css/all.min.css');
const fontAwesomeWebfonts = path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts');

safeCopy(fontAwesomeCSS, path.join(cssDir, 'fontawesome.min.css'));

if (fs.existsSync(fontAwesomeWebfonts)) {
  fs.readdirSync(fontAwesomeWebfonts).forEach(file => {
    safeCopy(
      path.join(fontAwesomeWebfonts, file),
      path.join(webfontsDir, file)
    );
  });
} else {
  console.warn('⚠️  Font Awesome webfonts directory not found');
}

console.log('\n✅ File copy process completed!');
