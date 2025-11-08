# Installing Poppler for PDF Processing

Poppler is required to convert PDF pages to images for OCR processing of scanned PDFs.

## Windows

### Option 1: Download Pre-built Binaries (Recommended)
1. Download poppler from: https://github.com/oschwartz10612/poppler-windows/releases
2. Extract the zip file to a location like `C:\poppler`
3. Add `C:\poppler\Library\bin` to your system PATH environment variable
4. Restart your terminal/IDE

### Option 2: Using Conda
```bash
conda install -c conda-forge poppler
```

### Option 3: Using Chocolatey
```bash
choco install poppler
```

## Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install poppler-utils
```

## Mac
```bash
brew install poppler
```

## Verify Installation
After installation, verify poppler is in your PATH:
```bash
pdftoppm -v
```

If the command works, poppler is installed correctly.

## Note
- Text-based PDFs will work without poppler (they use PyPDF2)
- Scanned PDFs require poppler to convert pages to images for OCR
- If poppler is not installed, you'll get a helpful error message with installation instructions


