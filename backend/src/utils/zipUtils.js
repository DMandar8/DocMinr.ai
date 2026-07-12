/**
 * ZIP Utilities
 * Handles ZIP file extraction and processing
 */
const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const yauzl = require('yauzl');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'odt', 'ods', 'odp', 'rtf', 'txt', 'csv', 'md', 'html', 'htm',
  'json', 'xml', 'sql', 'py', 'js', 'java', 'c', 'cpp', 'rb', 'go',
  'php', 'rs', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'tiff', 'webp',
  'ico', 'zip', 'rar', '7z', 'tar', 'gz', 'pkg', 'deb', 'rpm', 'dmg',
  'log', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf'
];

const MAX_EXTRACTED_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Extract ZIP file - RACE CONDITION FREE VERSION
 * Uses a counter-based approach that tracks all entries
 */
const extractZip = (zipPath, destDir) => {
  return new Promise((resolve, reject) => {
    const extractedFiles = [];
    let hasErrors = false;
    let isResolved = false;
    let pendingEntries = 0; // Tracks entries being processed
    let totalValidEntries = 0; // Tracks all valid entries found
    let entriesProcessed = 0; // Tracks completed entries
    let allEntriesRead = false; // Whether ZIP reading is complete

    // Ensure destination exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    console.log(`📂 Opening ZIP: ${zipPath}`);

    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        reject(new Error(`Failed to open ZIP: ${err.message}`));
        return;
      }

      /**
       * Check if all entries are processed and resolve
       */
      const checkCompletion = () => {
        // Only resolve when:
        // 1. All ZIP entries have been read
        // 2. All pending entries are complete
        // 3. We haven't resolved yet
        if (allEntriesRead && pendingEntries === 0 && !isResolved) {
          isResolved = true;
          console.log(`📦 Extraction complete. Extracted ${extractedFiles.length} files`);
          resolve({
            extractedFiles,
            totalFiles: extractedFiles.length,
            hasErrors,
          });
        }
      };

      /**
       * Process a single entry
       */
      const processEntry = (entry) => {
        const fileName = entry.fileName;
        
        // Skip directories
        if (/\/$/.test(fileName)) {
          zipfile.readEntry();
          return;
        }

        // Skip macOS hidden files
        if (fileName.startsWith('__MACOSX/') || 
            fileName.startsWith('._') || 
            fileName.includes('/._') ||
            fileName.startsWith('.DS_Store')) {
          zipfile.readEntry();
          return;
        }

        // Check extension
        const ext = path.extname(fileName).toLowerCase().slice(1);
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          console.warn(`⚠️ Skipping disallowed: ${fileName}`);
          zipfile.readEntry();
          return;
        }

        // Check size
        if (entry.uncompressedSize > MAX_EXTRACTED_FILE_SIZE) {
          console.warn(`⚠️ Skipping too large: ${fileName} (${entry.uncompressedSize} bytes)`);
          zipfile.readEntry();
          return;
        }

        // This is a valid file
        totalValidEntries++;
        pendingEntries++; // Increment pending count BEFORE processing
        console.log(`📄 Processing: ${fileName} (${entry.uncompressedSize} bytes)`);

        // Extract the file
        const filePath = path.join(destDir, fileName);
        const fileDir = path.dirname(filePath);

        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }

        zipfile.openReadStream(entry, (err, readStream) => {
          if (err) {
            console.error(`❌ Failed to open ${fileName}:`, err.message);
            hasErrors = true;
            entriesProcessed++;
            pendingEntries--; // Decrement pending
            checkCompletion();
            zipfile.readEntry();
            return;
          }

          const writeStream = createWriteStream(filePath);

          streamPipeline(readStream, writeStream)
            .then(() => {
              const stats = fs.statSync(filePath);
              
              extractedFiles.push({
                fileName: fileName,
                relativePath: fileName,
                storedName: path.basename(fileName),
                size: stats.size,
                path: filePath,
                extension: ext,
                mimeType: getMimeType(ext),
              });

              console.log(`✅ Extracted: ${fileName} (${stats.size} bytes)`);
              entriesProcessed++;
              pendingEntries--; // Decrement pending
              checkCompletion();
              zipfile.readEntry();
            })
            .catch((error) => {
              console.error(`❌ Failed to write ${fileName}:`, error.message);
              hasErrors = true;
              entriesProcessed++;
              pendingEntries--; // Decrement pending
              checkCompletion();
              zipfile.readEntry();
            });
        });
      };

      // Handle entry events
      zipfile.on('entry', (entry) => {
        processEntry(entry);
      });

      // Handle end of ZIP - all entries have been read
      zipfile.on('end', () => {
        allEntriesRead = true;
        console.log(`📊 ZIP read complete. Found ${totalValidEntries} valid files`);
        
        // If no valid entries, resolve
        if (totalValidEntries === 0 && !isResolved) {
          isResolved = true;
          resolve({
            extractedFiles: [],
            totalFiles: 0,
            hasErrors: true,
          });
        } else {
          // Check completion after a delay to allow pending operations
          setTimeout(() => {
            checkCompletion();
          }, 500);
        }
      });

      // Handle ZIP errors - DON'T reject if we have files
      zipfile.on('error', (error) => {
        console.error('❌ ZIP read error:', error);
        
        // If we already have extracted files, resolve with what we have
        if (extractedFiles.length > 0 && !isResolved) {
          isResolved = true;
          console.log(`📦 Resolving with ${extractedFiles.length} files despite error`);
          resolve({
            extractedFiles,
            totalFiles: extractedFiles.length,
            hasErrors: true,
          });
        } else if (!isResolved) {
          isResolved = true;
          reject(new Error(`ZIP read error: ${error.message}`));
        }
      });

      // Safety timeout - 120 seconds
      setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          console.warn(`⏰ Timeout: Resolving with ${extractedFiles.length} files`);
          resolve({
            extractedFiles,
            totalFiles: extractedFiles.length,
            hasErrors: true,
          });
        }
      }, 120000);

      // Start reading entries
      zipfile.readEntry();
    });
  });
};

/**
 * Get MIME type from extension
 */
const getMimeType = (extension) => {
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'csv': 'text/csv',
    'json': 'application/json',
    'sql': 'text/x-sql',
    'py': 'text/x-python',
    'js': 'text/x-javascript',
    'md': 'text/markdown',
    'xml': 'application/xml',
    'html': 'text/html',
    'htm': 'text/html',
    'rtf': 'application/rtf',
    'odt': 'application/vnd.oasis.opendocument.text',
    'ods': 'application/vnd.oasis.opendocument.spreadsheet',
    'odp': 'application/vnd.oasis.opendocument.presentation',
  };
  return mimeTypes[extension] || 'application/octet-stream';
};

/**
 * Clean up temp directory
 */
const cleanupTempDir = (dir) => {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`🧹 Cleaned up: ${dir}`);
    }
  } catch (error) {
    console.error(`Failed to cleanup ${dir}:`, error.message);
  }
};

module.exports = {
  extractZip,
  cleanupTempDir,
  getFileExtension: (filename) => path.extname(filename).toLowerCase().slice(1),
  ALLOWED_EXTENSIONS,
};