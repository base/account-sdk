const fs = require('fs');
const glob = require('glob');
const sass = require('sass');

async function main() {
  // ================================
  // Compiling SCSS
  // ================================
  const scssFiles = glob.sync(`${__dirname}/src/**/*.scss`);
  for (const filePath of scssFiles) {
    console.info(`\nCompiling SCSS\n${filePath}...`);
    const css = sass.renderSync({ file: filePath, outputStyle: 'compressed' }).css.toString('utf8');
    const ts = `export default (() => \`${css}\`)();`;
    fs.writeFileSync(filePath.replace(/\.scss$/, '-css.ts'), ts, {
      mode: 0o644,
    });
  }

  console.info('\nAsset compilation complete!');
}

main();
