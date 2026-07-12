const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const {
  sequelize,
  Provider,
  Schedule,
  GreenService,
  TourGallery
} = require('../../src/models');

const EXCEL_PATH = process.env.DEMO_TOURS_XLSX
  ? path.resolve(process.env.DEMO_TOURS_XLSX)
  : path.resolve(__dirname, '../data/greensteps_tour_dataset_project_image_paths.xlsx');

const PUBLIC_ROOT = path.resolve(__dirname, '../../frontend/public');
const GREENSTEPS_IMAGE_ROOT = path.join(PUBLIC_ROOT, 'image/greensteps');

const summary = {
  providersUpdated: 0,
  schedulesUpdated: 0,
  servicesUpdated: 0,
  galleriesUpserted: 0,
  missingAssets: [],
  skippedMissingColumns: [],
  warnings: []
};

function clean(value) {
  return value === null || value === undefined || String(value).trim() === '' ? null : String(value).trim();
}

function integer(value, fallback = 1) {
  const parsed = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function sheetRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  return sheet ? XLSX.utils.sheet_to_json(sheet, { defval: null }) : [];
}

function publicImageExists(url) {
  if (!url || /^https?:\/\//i.test(url)) return true;
  return fs.existsSync(path.join(PUBLIC_ROOT, url.replace(/^\/+/, '')));
}

function buildLocalImageIndex() {
  const images = new Map();

  const visit = (folder) => {
    if (!fs.existsSync(folder)) return;

    fs.readdirSync(folder, { withFileTypes: true }).forEach((entry) => {
      const fullPath = path.join(folder, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        return;
      }

      const publicPath = `/${path.relative(PUBLIC_ROOT, fullPath).replace(/\\/g, '/')}`;
      images.set(entry.name.toLowerCase(), publicPath);
    });
  };

  visit(GREENSTEPS_IMAGE_ROOT);
  return images;
}

const localImageIndex = buildLocalImageIndex();

function resolveImageUrl(url, context) {
  const rawUrl = clean(url);
  if (!rawUrl || /^https?:\/\//i.test(rawUrl) || publicImageExists(rawUrl)) return rawUrl;

  const resolvedUrl = localImageIndex.get(path.basename(rawUrl).toLowerCase());
  if (resolvedUrl) return resolvedUrl;

  summary.missingAssets.push({ context, url: rawUrl });
  return rawUrl;
}

async function alignModelWithDatabase(model) {
  const columns = await sequelize.getQueryInterface().describeTable(model.getTableName());
  const removed = [];

  Object.keys(model.rawAttributes).forEach((attributeName) => {
    const fieldName = model.rawAttributes[attributeName].field || attributeName;
    if (columns[fieldName]) return;
    delete model.rawAttributes[attributeName];
    removed.push(fieldName);
  });

  if (removed.length) {
    model.refreshAttributes();
    summary.skippedMissingColumns.push(`${model.name}: ${removed.join(', ')}`);
  }
}

async function updateImage(model, id, imageUrl) {
  if (!id || !imageUrl) return false;
  const [updated] = await model.update({ image_url: imageUrl }, { where: { id } });
  return updated > 0;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('--audit');
  const workbook = XLSX.readFile(EXCEL_PATH, { cellDates: false });
  const providerRows = sheetRows(workbook, 'Provider');
  const scheduleRows = sheetRows(workbook, 'Schedule');
  const serviceRows = sheetRows(workbook, 'GreenService');
  const tourImages = sheetRows(workbook, 'TourImage')
    .filter((row) => clean(row.ID_Schedule) && clean(row.image_url) && clean(row.image_type) !== 'cover');

  const resolved = {
    providers: providerRows.map((row, index) => ({
      id: clean(row.ID_Provider),
      image_url: resolveImageUrl(row.image_url, `Provider row ${index + 2}`)
    })),
    schedules: scheduleRows.map((row, index) => ({
      id: clean(row.ID_Schedule),
      image_url: resolveImageUrl(row.image_url, `Schedule row ${index + 2}`)
    })),
    services: serviceRows.map((row, index) => ({
      id: clean(row.ID_Service),
      image_url: resolveImageUrl(row.image_url, `GreenService row ${index + 2}`)
    })),
    galleries: tourImages.map((row, index) => ({
      id: clean(row.ID_Image),
      schedule_id: clean(row.ID_Schedule),
      image_url: resolveImageUrl(row.image_url, `TourImage row ${index + 2}`),
      sort_order: integer(row.sort_order, index + 1)
    }))
  };

  if (isDryRun) {
    console.log('\n=== GreenSteps Image Import Dry Run ===');
    console.log(`Excel file: ${EXCEL_PATH}`);
    console.log(`Providers ready: ${resolved.providers.length}`);
    console.log(`Schedules ready: ${resolved.schedules.length}`);
    console.log(`Green services ready: ${resolved.services.length}`);
    console.log(`Tour galleries ready: ${resolved.galleries.length}`);
    console.log(`Missing assets: ${summary.missingAssets.length}`);
    if (summary.missingAssets.length) {
      summary.missingAssets.forEach((item) => console.log(`- ${item.context}: ${item.url}`));
    }
    console.log('\nDry run only: database was not changed.');
    return;
  }

  await sequelize.authenticate();
  await Promise.all([
    alignModelWithDatabase(Provider),
    alignModelWithDatabase(Schedule),
    alignModelWithDatabase(GreenService),
    alignModelWithDatabase(TourGallery)
  ]);

  for (const row of resolved.providers) {
    const id = row.id;
    const imageUrl = row.image_url;
    if (await updateImage(Provider, id, imageUrl)) summary.providersUpdated += 1;
  }

  for (const row of resolved.schedules) {
    const id = row.id;
    const imageUrl = row.image_url;
    if (await updateImage(Schedule, id, imageUrl)) summary.schedulesUpdated += 1;
  }

  for (const row of resolved.services) {
    const id = row.id;
    const imageUrl = row.image_url;
    if (await updateImage(GreenService, id, imageUrl)) summary.servicesUpdated += 1;
  }

  const scheduleIds = [...new Set(resolved.galleries.map((row) => row.schedule_id).filter(Boolean))];
  if (scheduleIds.length) {
    await TourGallery.destroy({ where: { schedule_id: scheduleIds } });
  }

  for (const row of resolved.galleries) {
    const scheduleId = row.schedule_id;
    const sortOrder = row.sort_order;
    const imageUrl = row.image_url;
    const payload = {
      id: row.id || `${scheduleId}_gallery_${String(sortOrder).padStart(2, '0')}`,
      schedule_id: scheduleId,
      image_url: imageUrl,
      sort_order: sortOrder
    };

    await TourGallery.upsert(payload);
    summary.galleriesUpserted += 1;
  }

  console.log('\n=== GreenSteps Image Import Summary ===');
  console.log(`Excel file: ${EXCEL_PATH}`);
  console.log(`Providers updated: ${summary.providersUpdated}`);
  console.log(`Schedules updated: ${summary.schedulesUpdated}`);
  console.log(`Green services updated: ${summary.servicesUpdated}`);
  console.log(`Tour galleries upserted: ${summary.galleriesUpserted}`);
  console.log(`Missing assets: ${summary.missingAssets.length}`);
  if (summary.missingAssets.length) {
    summary.missingAssets.forEach((item) => console.log(`- ${item.context}: ${item.url}`));
  }
  if (summary.skippedMissingColumns.length) {
    console.log('\nSkipped missing DB columns:');
    summary.skippedMissingColumns.forEach((item) => console.log(`- ${item}`));
  }
}

main()
  .catch((error) => {
    console.error('\nFatal image import error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close().catch(() => {});
  });
