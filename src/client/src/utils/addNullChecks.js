#!/usr/bin/env node

/**
 * Script to automatically add null/undefined checks to TypeScript files
 * This script will:
 * 1. Find all .ts and .tsx files
 * 2. Add import for safeAccess utilities if needed
 * 3. Replace common patterns with safer alternatives
 */

const fs = require('fs');
const path = require('path');

const SAFE_ACCESS_IMPORT = "import { withDefault, safeGet, isDefined, ensureArray, ensureString } from '../utils/safeAccess';";
const SAFE_ACCESS_IMPORT_RELATIVE = "import { withDefault, safeGet, isDefined, ensureArray, ensureString } from './safeAccess';";

// Patterns to replace
const replacements = [
  // Replace obj?.prop || defaultValue with withDefault(obj?.prop, defaultValue)
  {
    pattern: /(\w+)\?\.(\w+)\s*\|\|\s*(['"`][^'"`]*['"`]|\d+|false|true|null|undefined|\[\]|\{\})/g,
    replacement: "withDefault($1?.$2, $3)"
  },
  
  // Replace array?.map with ensureArray(array).map
  {
    pattern: /(\w+)\?\.(map|filter|forEach|reduce|find|some|every)\(/g,
    replacement: "ensureArray($1).$2("
  },
  
  // Replace response.data.field with safeGet(response, 'data.field', null)
  {
    pattern: /response\.data\.(\w+)(?!\?)/g,
    replacement: "safeGet(response, 'data.$1', null)"
  },
  
  // Replace user?.name || '' with ensureString(user?.name)
  {
    pattern: /(\w+)\?\.(\w+)\s*\|\|\s*['"]['"`]/g,
    replacement: "ensureString($1?.$2)"
  }
];

function processFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  if (filePath.includes('node_modules')) return;
  if (filePath.includes('.test.')) return;
  if (filePath.includes('.spec.')) return;
  if (filePath.includes('safeAccess.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file already has the import
  const hasImport = content.includes('from \'../utils/safeAccess\'') || 
                   content.includes('from \'./safeAccess\'') ||
                   content.includes('from \'../../utils/safeAccess\'');
  
  // Apply replacements
  replacements.forEach(({ pattern, replacement }) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  // Add import if modifications were made and import doesn't exist
  if (modified && !hasImport) {
    // Determine relative path to safeAccess
    const relativePath = path.relative(path.dirname(filePath), 
      path.join(__dirname, '../utils/safeAccess')).replace(/\\/g, '/');
    
    const importStatement = relativePath.startsWith('.') 
      ? `import { withDefault, safeGet, isDefined, ensureArray, ensureString } from '${relativePath}';`
      : SAFE_ACCESS_IMPORT;
    
    // Add import after other imports
    const importMatch = content.match(/^import .* from .*;$/m);
    if (importMatch) {
      const lastImportIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
      content = content.slice(0, lastImportIndex) + '\n' + importStatement + content.slice(lastImportIndex);
    } else {
      // Add at the beginning if no imports found
      content = importStatement + '\n\n' + content;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  }
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      processFile(fullPath);
    }
  });
}

// Start processing from src directory
const srcPath = path.join(__dirname, '..');
console.log('🔍 Scanning for TypeScript files to add null checks...');
processDirectory(srcPath);
console.log('✨ Done!');