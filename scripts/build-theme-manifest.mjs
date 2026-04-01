import fs from 'node:fs';
import path from 'node:path';

const MAX_MANIFEST_BYTES = 95 * 1024;
const rootDir = process.cwd();
const manifestPath = path.join(rootDir, 'theme-manifest.json');
const pagesDir = path.join(rootDir, 'config', 'pages');
const distDir = path.join(rootDir, 'dist');
const outputPath = path.join(distDir, 'theme-manifest.json');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const toCanonicalId = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');

const optionValue = (option) => (typeof option === 'object' && option !== null ? option.value : option);

const defaultForField = (field = {}) => {
  if (field.default !== undefined) return field.default;

  switch (field.type) {
    case 'repeater':
      return Array.isArray(field.default) ? field.default : [];
    case 'menu':
      return '';
    case 'select': {
      const options = Array.isArray(field.options) ? field.options : [];
      const firstOption = options[0];
      return firstOption !== undefined ? optionValue(firstOption) : '';
    }
    default:
      return '';
  }
};

const normalizeFieldValue = (value, field = {}, fieldPath = '') => {
  const type = field.type;

  if (type === 'repeater') {
    if (!Array.isArray(value)) return [];
    const itemSchema = field.fields || {};
    return value.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new Error(`Invalid repeater item at "${fieldPath}[${index}]"`);
      }
      return normalizeContentBySchema(item, itemSchema, `${fieldPath}[${index}]`);
    });
  }

  if (type === 'menu') {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value;
    return '';
  }

  if (type === 'select') {
    const options = Array.isArray(field.options) ? field.options.map(optionValue) : [];
    const selected = value ?? defaultForField(field);
    const nextValue = String(selected);
    if (options.length > 0 && !options.includes(nextValue)) {
      throw new Error(`Invalid select value "${nextValue}" at "${fieldPath}"`);
    }
    return nextValue;
  }

  if (type === 'color' || type === 'text' || type === 'textarea' || type === 'image') {
    const raw = value ?? defaultForField(field);
    return raw === null || raw === undefined ? '' : String(raw);
  }

  if (type === 'link') {
    const raw = value ?? defaultForField(field);
    if (raw === null || raw === undefined) return '';
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object') return raw;
    return String(raw);
  }

  const raw = value ?? defaultForField(field);
  return raw === undefined ? '' : raw;
};

const normalizeContentBySchema = (content = {}, schema = {}, pathPrefix = '') => {
  const output = {};
  const contentObj = content && typeof content === 'object' && !Array.isArray(content) ? content : {};

  for (const key of Object.keys(contentObj)) {
    if (!(key in schema)) {
      throw new Error(`Unknown key "${key}" in content "${pathPrefix || 'root'}"`);
    }
  }

  for (const [key, field] of Object.entries(schema)) {
    const fieldPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    output[key] = normalizeFieldValue(contentObj[key], field, fieldPath);
  }

  return output;
};

const manifest = readJson(manifestPath);

if (!Array.isArray(manifest.sections) || !Array.isArray(manifest.pages)) {
  throw new Error('Manifest must contain "sections" and "pages" arrays.');
}

const sectionById = new Map();
manifest.sections = manifest.sections.map((section) => {
  const sectionId = toCanonicalId(section.id);
  if (!sectionId) throw new Error('Section id cannot be empty.');
  if (sectionById.has(sectionId)) throw new Error(`Duplicate section id "${sectionId}".`);

  const contentSchema = section.contentSchema || {};
  const sectionDefaults = normalizeContentBySchema(
    section.defaultContent || {},
    contentSchema,
    `section:${sectionId}`,
  );

  const normalizedSection = {
    ...section,
    id: sectionId,
    contentSchema,
    defaultContent: sectionDefaults,
    settingsSchema: contentSchema,
    // Compatibility alias used by some editors.
    fields: contentSchema,
  };

  sectionById.set(sectionId, normalizedSection);
  return normalizedSection;
});

manifest.pages = manifest.pages.map((page) => {
  const pageId = toCanonicalId(page.id);
  if (!pageId) throw new Error('Page id cannot be empty.');
  if (!Array.isArray(page.layout)) throw new Error(`Page "${pageId}" layout must be an array.`);

  const layout = page.layout.map((entry) => {
    const sectionId = toCanonicalId(entry.sectionId);
    if (!sectionById.has(sectionId)) {
      throw new Error(`Page "${pageId}" references unknown sectionId "${entry.sectionId}".`);
    }
    if (!entry.handle || typeof entry.handle !== 'string') {
      throw new Error(`Page "${pageId}" has layout entry without a valid handle.`);
    }
    return { ...entry, sectionId };
  });

  return { ...page, id: pageId, layout };
});

if (manifest.themeSettingsSchema && !manifest.settingsSchema) {
  manifest.settingsSchema = manifest.themeSettingsSchema;
}

const pageDefaults = {};
const pageFiles = fs.existsSync(pagesDir)
  ? fs.readdirSync(pagesDir).filter((fileName) => fileName.endsWith('.json')).sort()
  : [];

for (const fileName of pageFiles) {
  const pageId = toCanonicalId(path.basename(fileName, '.json'));
  const page = manifest.pages.find((item) => item.id === pageId);

  if (!page) {
    throw new Error(`Orphan page defaults file "${fileName}" has no matching manifest page id.`);
  }

  const rawPageDefaults = readJson(path.join(pagesDir, fileName));
  const rawHandles = Object.keys(rawPageDefaults || {});
  const layoutByHandle = new Map(page.layout.map((item) => [item.handle, item]));
  const normalizedPage = {};

  for (const handle of rawHandles) {
    const layoutEntry = layoutByHandle.get(handle);
    if (!layoutEntry) {
      throw new Error(`Invalid handle "${handle}" in config/pages/${fileName}.`);
    }

    const section = sectionById.get(layoutEntry.sectionId);
    normalizedPage[handle] = normalizeContentBySchema(
      rawPageDefaults[handle] || {},
      section.contentSchema || {},
      `${pageId}.${handle}`,
    );
  }

  pageDefaults[pageId] = normalizedPage;
}

// Keep page defaults in config/pages to avoid oversized manifests on upload.
delete manifest.themeSettings;
delete manifest.settings;

fs.mkdirSync(distDir, { recursive: true });
// Compact JSON keeps theme-manifest under upload limits (pretty-print inflates UTF-8 size).
const serialized = JSON.stringify(manifest);
const sizeInBytes = Buffer.byteLength(serialized, 'utf8');

if (sizeInBytes > MAX_MANIFEST_BYTES) {
  throw new Error(
    `theme-manifest.json is too large (${sizeInBytes} bytes). Limit is ${MAX_MANIFEST_BYTES} bytes.`,
  );
}

fs.writeFileSync(outputPath, serialized);
console.log(`Built manifest: ${outputPath} (${sizeInBytes} bytes)`);

