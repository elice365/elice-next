#!/usr/bin/env node

/**
 * Migration script to replace console.log statements with centralized logger
 * Usage: node scripts/migrate-logging.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SOURCE_DIRS = [
  'app',
  'components', 
  'hooks',
  'lib',
  'utils',
  'stores'
];

const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  '*.test.*',
  '*.spec.*',
  'scripts/migrate-logging.js' // Don't migrate this file
];

// Logger import mappings by directory
const LOGGER_MAPPINGS = {
  'hooks/auth': '@/utils/logger',
  'hooks/api': '@/utils/logger', 
  'hooks/admin': '@/utils/logger',
  'hooks/flo': '@/utils/logger',
  'hooks/blog': '@/utils/logger',
  'components': '@/utils/logger',
  'lib/db': '@/utils/logger',
  'lib/services': '@/utils/logger',
  'lib/request': '@/utils/logger',
  'lib/flo': '@/utils/logger',
  'stores': '@/utils/logger',
  'app/api': '@/utils/logger',
  'default': '@/utils/logger'
};

// Context mappings for different file types
const CONTEXT_MAPPINGS = {
  // Auth related
  'auth': 'auth',
  'login': 'auth',
  'token': 'auth',
  'session': 'auth',
  
  // API related
  'api': 'api',
  'route.ts': 'api',
  'request': 'api',
  
  // Database related
  'db': 'db',
  'prisma': 'db',
  
  // FLO music service
  'flo': 'flo',
  'music': 'music',
  
  // Admin
  'admin': 'api',
  
  // Blog
  'blog': 'general',
  
  // Default
  'default': 'general'
};

// Migration patterns
const MIGRATION_PATTERNS = [
  {
    // console.log -> logger.info
    pattern: /console\.log\((.*)\)/g,
    replacement: (match, args, context) => `logger.${context}.info(${args})`
  },
  {
    // console.error -> logger.error  
    pattern: /console\.error\((.*)\)/g,
    replacement: (match, args, context) => `logger.${context}.error(${args})`
  },
  {
    // console.warn -> logger.warn
    pattern: /console\.warn\((.*)\)/g, 
    replacement: (match, args, context) => `logger.${context}.warn(${args})`
  },
  {
    // console.info -> logger.info
    pattern: /console\.info\((.*)\)/g,
    replacement: (match, args, context) => `logger.${context}.info(${args})`
  },
  {
    // console.debug -> logger.debug
    pattern: /console\.debug\((.*)\)/g,
    replacement: (match, args, context) => `logger.${context}.debug(${args})`
  }
];

/**
 * Get files to process
 */
function getFilesToProcess() {
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  const files = [];
  
  for (const dir of SOURCE_DIRS) {
    if (!fs.existsSync(dir)) continue;
    
    const dirFiles = execSync(`find ${dir} -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\)`)
      .toString()
      .split('\n')
      .filter(file => file.trim())
      .filter(file => !EXCLUDE_PATTERNS.some(pattern => file.includes(pattern)));
      
    files.push(...dirFiles);
  }
  
  return files;
}

/**
 * Determine context from file path
 */
function getContextFromPath(filePath) {
  const normalizedPath = filePath.toLowerCase();
  
  for (const [key, context] of Object.entries(CONTEXT_MAPPINGS)) {
    if (normalizedPath.includes(key)) {
      return context;
    }
  }
  
  return CONTEXT_MAPPINGS.default;
}

/**
 * Check if file needs logger import
 */
function needsLoggerImport(content) {
  return /console\.(log|error|warn|info|debug)/.test(content) && 
         !content.includes('from \'@/utils/logger\'') &&
         !content.includes('from "@/utils/logger"');
}

/**
 * Add logger import to file
 */
function addLoggerImport(content, filePath) {
  const loggerPath = LOGGER_MAPPINGS.default;
  
  // Find the last import statement
  const importRegex = /^import\s+.*from\s+['"].*['"];?\s*$/gm;
  const matches = [...content.matchAll(importRegex)];
  
  if (matches.length === 0) {
    // No imports found, add at the top after 'use client' or other directives
    const directiveRegex = /^(['"]use \w+['"];\s*$)/gm;
    const directiveMatches = [...content.matchAll(directiveRegex)];
    
    if (directiveMatches.length > 0) {
      const lastDirective = directiveMatches[directiveMatches.length - 1];
      const insertIndex = lastDirective.index + lastDirective[0].length;
      return content.slice(0, insertIndex) + 
             `\nimport { logger } from '${loggerPath}';\n` + 
             content.slice(insertIndex);
    } else {
      return `import { logger } from '${loggerPath}';\n` + content;
    }
  } else {
    // Add after the last import
    const lastImport = matches[matches.length - 1];
    const insertIndex = lastImport.index + lastImport[0].length;
    return content.slice(0, insertIndex) + 
           `\nimport { logger } from '${loggerPath}';` + 
           content.slice(insertIndex);
  }
}

/**
 * Migrate console statements in content
 */
function migrateConsoleStatements(content, context) {
  let newContent = content;
  
  for (const pattern of MIGRATION_PATTERNS) {
    newContent = newContent.replace(pattern.pattern, (match, args) => {
      // Simple argument processing - for complex cases manual review needed
      const processedArgs = args.trim();
      
      // If args contain multiple parameters, split and format appropriately
      if (processedArgs.includes(',')) {
        const parts = processedArgs.split(',').map(p => p.trim());
        const message = parts[0];
        const data = parts.slice(1).join(', ');
        
        if (data) {
          return `logger.${context}.${pattern.pattern.source.includes('error') ? 'error' : 
                                     pattern.pattern.source.includes('warn') ? 'warn' :
                                     pattern.pattern.source.includes('debug') ? 'debug' : 'info'}(${message}, ${data})`;
        }
      }
      
      return `logger.${context}.${pattern.pattern.source.includes('error') ? 'error' : 
                                 pattern.pattern.source.includes('warn') ? 'warn' :
                                 pattern.pattern.source.includes('debug') ? 'debug' : 'info'}(${processedArgs})`;
    });
  }
  
  return newContent;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if no console statements
    if (!/console\.(log|error|warn|info|debug)/.test(content)) {
      return { processed: false, reason: 'No console statements found' };
    }
    
    // Skip if already has logger import
    if (content.includes('from \'@/utils/logger\'') || content.includes('from "@/utils/logger"')) {
      return { processed: false, reason: 'Already has logger import' };
    }
    
    const context = getContextFromPath(filePath);
    let newContent = content;
    
    // Add logger import
    if (needsLoggerImport(content)) {
      newContent = addLoggerImport(newContent, filePath);
    }
    
    // Migrate console statements
    newContent = migrateConsoleStatements(newContent, context);
    
    // Only write if content changed
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return { processed: true, context };
    }
    
    return { processed: false, reason: 'No changes needed' };
    
  } catch (error) {
    return { processed: false, error: error.message };
  }
}

/**
 * Main migration function
 */
function main() {
  console.log('🔄 Starting console.log migration to centralized logger...\n');
  
  const files = getFilesToProcess();
  console.log(`📁 Found ${files.length} files to check\n`);
  
  const results = {
    processed: 0,
    skipped: 0,
    errors: 0,
    contexts: {}
  };
  
  for (const file of files) {
    process.stdout.write(`Processing ${file}... `);
    
    const result = processFile(file);
    
    if (result.processed) {
      console.log(`✅ Migrated (${result.context})`);
      results.processed++;
      results.contexts[result.context] = (results.contexts[result.context] || 0) + 1;
    } else if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      results.errors++;
    } else {
      console.log(`⏭️  Skipped: ${result.reason}`);
      results.skipped++;
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`✅ Processed: ${results.processed} files`);
  console.log(`⏭️  Skipped: ${results.skipped} files`);
  console.log(`❌ Errors: ${results.errors} files`);
  
  if (Object.keys(results.contexts).length > 0) {
    console.log('\n🏷️  Contexts used:');
    for (const [context, count] of Object.entries(results.contexts)) {
      console.log(`   ${context}: ${count} files`);
    }
  }
  
  console.log('\n✨ Migration completed!');
  console.log('⚠️  Please review the changes and test thoroughly before committing.');
}

if (require.main === module) {
  main();
}