# How to Preview Mermaid Diagrams in Cursor/VS Code

## Quick Setup Guide

### Step 1: Install Mermaid Extension

1. Open Extensions panel:
   - **Mac**: `Cmd + Shift + X`
   - **Windows/Linux**: `Ctrl + Shift + X`

2. Search for one of these extensions:
   - **"Markdown Preview Mermaid Support"** (by Matt Bierner) - Recommended
   - **"Mermaid Preview"** (by vstirbu)
   - **"Mermaid Editor"** (by Tomoyuki Aota)

3. Click **Install** on your preferred extension

### Step 2: Preview Methods

#### Method A: Preview Markdown File (Easiest)
1. Open `DATABASE_SCHEMA_PREVIEW.md`
2. Press `Cmd+Shift+V` (Mac) or `Ctrl+Shift+V` (Windows/Linux)
3. The diagram will render in the preview pane

#### Method B: Preview .mmd File Directly
1. Open `database-schema.mmd`
2. Right-click in the editor
3. Select **"Open Preview"** or **"Mermaid: Preview"**
4. Or use Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) → Type "Mermaid Preview"

#### Method C: Split View
1. Open the markdown file
2. Press `Cmd+K V` (Mac) or `Ctrl+K V` (Windows/Linux)
3. This opens preview side-by-side with the source

### Step 3: Export Options

Most Mermaid extensions allow you to:
- Export as PNG
- Export as SVG
- Copy diagram code
- Open in browser

## Recommended Extensions

### 1. Markdown Preview Mermaid Support
- **ID**: `bierner.markdown-mermaid`
- **Features**: Adds Mermaid support to built-in Markdown preview
- **Best for**: Viewing diagrams in markdown files

### 2. Mermaid Preview
- **ID**: `vstirbu.vscode-mermaid-preview`
- **Features**: Dedicated preview for .mmd files
- **Best for**: Working with standalone Mermaid files

### 3. Mermaid Editor
- **ID**: `tomoyukim.vscode-mermaid-editor`
- **Features**: Full editor with live preview
- **Best for**: Editing and creating diagrams

## Troubleshooting

### Diagram Not Rendering?
1. Make sure extension is installed and enabled
2. Reload VS Code/Cursor: `Cmd+Shift+P` → "Reload Window"
3. Check file extension (.md or .mmd)
4. Verify Mermaid syntax is correct

### Preview Not Showing?
1. Try the Command Palette method
2. Check if extension requires restart
3. Try a different Mermaid extension

### Need Better Rendering?
- Use [Mermaid Live Editor](https://mermaid.live/) online
- Export as SVG/PNG for sharing
- Use GitHub's built-in Mermaid support

## Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Open Extensions | `Cmd+Shift+X` | `Ctrl+Shift+X` |
| Markdown Preview | `Cmd+Shift+V` | `Ctrl+Shift+V` |
| Split Preview | `Cmd+K V` | `Ctrl+K V` |
| Command Palette | `Cmd+Shift+P` | `Ctrl+Shift+P` |

## Files Available

- `database-schema.mmd` - Standalone Mermaid file
- `DATABASE_SCHEMA_PREVIEW.md` - Markdown file with embedded diagram
- `DATABASE_SCHEMA_DIAGRAM.md` - Full documentation with diagram

All three files contain the same diagram - use whichever format works best for your workflow!
