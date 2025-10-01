# Export All Data Feature

## Overview

The Export All Data feature in Account Settings allows users to backup all their writing data from Twain Story Writer into a comprehensive ZIP archive.

## What Gets Exported

### 1. Book Structure

For each book in your library, the export creates:

- `Books/[Book Name]/`
  - `book_info.json` - Book metadata
  - `Ideas/` - All book ideas as RTF files
  - `Characters/` - Character profiles as RTF files
  - `Outlines/` - Story outlines as RTF files
  - `Stories/` - Complete stories as RTF files
  - `Chapters/` - Individual chapters as RTF files
  - `Parts/` - Story parts organization as RTF files

### 2. Quick Stories

- `Quick Stories/` - All standalone quick stories as RTF files

### 3. Additional Files

- `export_metadata.json` - Technical metadata about the export
- `README.txt` - Instructions and file structure explanation

## File Format

- All content is exported in **RTF (Rich Text Format)**
- RTF files can be opened by most word processors:
  - Microsoft Word
  - Google Docs
  - LibreOffice Writer
  - TextEdit (Mac)
  - WordPad (Windows)

## File Organization

- Files are numbered (001*, 002*, etc.) for easy sorting
- Special characters in titles are replaced with underscores
- Empty categories include placeholder files explaining no content was found

## Usage

1. Go to Account Settings
2. Click "Export All Data" button
3. Wait for the export to complete (button shows "Exporting..." with spinner)
4. The ZIP file will be automatically downloaded

## File Name Convention

`Twain_Story_Writer_Backup_YYYY-MM-DD.zip`

## Technical Details

- Uses localStorage data with correct storage key patterns
- Converts Quill Delta format to plain text
- Creates compressed ZIP archives
- Includes error handling and user feedback
- Shows loading state during export process

## Error Handling

- Validates user session before export
- Handles missing or corrupted data gracefully
- Provides detailed error messages if export fails
- Includes fallback content for empty sections
