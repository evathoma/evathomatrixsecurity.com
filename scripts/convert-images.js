const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const projectDirectory = path.join(__dirname, '..');
const imageDirectory = path.join(__dirname, '../public/assets/images');
const manifestPath = path.join(projectDirectory, 'src/generated/image-manifest.json');
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const responsiveWidths = [320, 400, 480, 640, 768, 960, 1280, 1600];

function publicImagePath(filePath) {
  const relativePath = path.relative(imageDirectory, filePath);
  return `/assets/images/${relativePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`;
}

function imageManifestKey(filePath) {
  const relativePath = path.relative(imageDirectory, filePath);
  return `/assets/images/${relativePath.split(path.sep).join('/')}`;
}

async function fileStatsOrNull(filePath) {
  try {
    return await fs.stat(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function findRasterImages(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findRasterImages(filePath);
    const extension = path.extname(entry.name).toLowerCase();
    const isResponsiveVariant = /\.responsive-\d+\.webp$/i.test(entry.name);
    return imageExtensions.has(extension) && !isResponsiveVariant ? [filePath] : [];
  }));
  return files.flat();
}

async function main() {
  const sourceFiles = await findRasterImages(imageDirectory);
  let converted = 0;
  let responsiveVariants = 0;
  const images = {};
  const imageGroups = new Map();

  for (const sourcePath of sourceFiles) {
    const extension = path.extname(sourcePath);
    const basePath = sourcePath.slice(0, -extension.length);
    const group = imageGroups.get(basePath) || [];
    group.push(sourcePath);
    imageGroups.set(basePath, group);
  }

  for (const [basePath, sourcePaths] of imageGroups) {
    const rasterPath = sourcePaths.find((sourcePath) => path.extname(sourcePath).toLowerCase() !== '.webp');
    const inputPath = rasterPath || sourcePaths[0];
    const sourceStats = await fs.stat(inputPath);
    const outputPath = `${basePath}.webp`;
    const outputStats = await fileStatsOrNull(outputPath);

    if (rasterPath && (!outputStats || outputStats.mtimeMs < sourceStats.mtimeMs)) {
      await sharp(inputPath)
        .rotate()
        .webp({ quality: 82, effort: 5 })
        .toFile(outputPath);
      converted += 1;
    }

    const sourceMetadata = await sharp(inputPath).metadata();
    const isRotated = [5, 6, 7, 8].includes(sourceMetadata.orientation);
    const width = isRotated ? sourceMetadata.height : sourceMetadata.width;
    const height = isRotated ? sourceMetadata.width : sourceMetadata.height;
    const variants = [];

    for (const variantWidth of responsiveWidths) {
      if (variantWidth >= width) continue;

      const variantPath = `${basePath}.responsive-${variantWidth}.webp`;
      const variantStats = await fileStatsOrNull(variantPath);
      if (!variantStats || variantStats.mtimeMs < sourceStats.mtimeMs) {
        await sharp(inputPath)
          .rotate()
          .resize({ width: variantWidth, withoutEnlargement: true })
          .webp({ quality: 80, effort: 5 })
          .toFile(variantPath);
        responsiveVariants += 1;
      }

      variants.push({ url: publicImagePath(variantPath), width: variantWidth });
    }

    variants.push({ url: publicImagePath(outputPath), width });
    const imageMetadata = {
      width,
      height,
      webp: publicImagePath(outputPath),
      srcset: variants
        .sort((left, right) => left.width - right.width)
        .map((variant) => `${variant.url} ${variant.width}w`)
        .join(', '),
    };
    sourcePaths.forEach((sourcePath) => {
      images[imageManifestKey(sourcePath)] = imageMetadata;
    });
  }

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify({ images }, null, 2)}\n`);

  console.info(JSON.stringify({
    event: 'images.webp_generated',
    converted,
    skipped: imageGroups.size - converted,
    responsiveVariants,
    imageCount: imageGroups.size,
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({ event: 'images.webp_generation_failed', message: error.message }));
  process.exitCode = 1;
});
