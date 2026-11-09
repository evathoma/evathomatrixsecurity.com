const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const esbuild = require('esbuild');

const projectDirectory = path.join(__dirname, '..');
const publicDirectory = path.join(projectDirectory, 'public');
const buildDirectory = path.join(publicDirectory, 'build');
const manifestPath = path.join(projectDirectory, 'src/generated/asset-manifest.json');

const scriptBundles = {
  home: ['api.js', 'email-inquiry.js', 'page-effects.js', 'home-v2.js'],
  standard: ['api.js', 'page-effects.js', 'main.js'],
  contact: ['api.js', 'email-inquiry.js', 'page-effects.js', 'main.js'],
  coverage: ['api.js', 'page-effects.js', 'main.js', 'coverage.js'],
};

const styleBundles = {
  home: ['home-v2.css', 'tailwind.css', 'a11y-responsive.css'],
  standard: ['style.css', 'a11y-responsive.css'],
  coverage: ['style.css', 'coverage.css', 'a11y-responsive.css'],
};

function importSpecifier(filePath) {
  return `./${path.relative(projectDirectory, filePath).split(path.sep).join('/')}`;
}

async function buildHashedAsset(name, extension, contents, format) {
  const result = await esbuild.build({
    stdin: {
      contents,
      resolveDir: projectDirectory,
      sourcefile: `${name}.${extension}`,
      loader: extension === 'css' ? 'css' : 'js',
    },
    bundle: true,
    minify: true,
    legalComments: 'none',
    target: ['es2020'],
    ...(format ? { format } : {}),
    outfile: path.join(buildDirectory, `${name}.${extension}`),
    write: false,
  });
  const output = result.outputFiles.find((file) => file.path.endsWith(`.${extension}`));

  if (!output) {
    throw new Error(`Build did not produce the expected ${extension} asset for "${name}".`);
  }

  const hash = crypto.createHash('sha256').update(output.contents).digest('hex').slice(0, 12);
  const assetTypeDirectory = extension === 'js' ? 'js' : 'css';
  const relativePath = `${assetTypeDirectory}/${name}-${hash}.${extension}`;
  const outputPath = path.join(buildDirectory, relativePath);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, output.contents);

  return `/build/${relativePath}`;
}

async function main() {
  await fs.rm(buildDirectory, { recursive: true, force: true });
  await fs.mkdir(buildDirectory, { recursive: true });

  const javascript = {};
  const stylesheets = {};

  for (const [name, files] of Object.entries(scriptBundles)) {
    const imports = files
      .map((file) => `import ${JSON.stringify(importSpecifier(path.join(publicDirectory, 'js', file)))};`)
      .join('\n');
    javascript[name] = await buildHashedAsset(name, 'js', imports, 'iife');
  }

  for (const [name, files] of Object.entries(styleBundles)) {
    const imports = files
      .map((file) => `@import ${JSON.stringify(importSpecifier(path.join(publicDirectory, 'css', file)))};`)
      .join('\n');
    stylesheets[name] = await buildHashedAsset(name, 'css', imports);
  }

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify({ javascript, stylesheets }, null, 2)}\n`);

  console.info(JSON.stringify({
    event: 'assets.production_built',
    javascriptBundles: Object.keys(javascript).length,
    stylesheets: Object.keys(stylesheets).length,
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({ event: 'assets.build_failed', message: error.message }));
  process.exitCode = 1;
});
