# LinkedIn Learning Task List Exporter

> A Tampermonkey / Greasemonkey userscript that extracts a LinkedIn Learning course's table of contents (sections and videos) and exports it as a plain-text task list, ready to paste into Todoist, Habitica, or any task manager.

<!-- SCREENSHOT PLACEHOLDER: Replace with a screenshot of the floating panel in action -->
<!-- ![Screenshot of the Export Modules panel on a LinkedIn Learning course page](./screenshot.png) -->

---

## Features

- **One-click scraping** of all course sections and video titles directly from the LinkedIn Learning player
- **Automatic section expansion** so collapsed modules are never missed
- **Four export formats** to match your workflow:
  - **Nested (Todoist)** -- sections as parent tasks with videos indented beneath
  - **Flat list (Habitica)** -- every video on its own line
  - **Numbered** -- sequential numbering across all sections (01, 02, ...)
  - **Sections only** -- just the module/section headings
- **Optional duration tags** appended to each video title
- **Course title prefix** to keep items identifiable when mixing multiple courses
- **Copy to clipboard** with a single click
- **Resilient selectors** with built-in fallbacks so the script keeps working when LinkedIn changes class names

---

## Requirements

| Requirement | Details |
|---|---|
| Browser | Chrome, Firefox, Edge, or any Chromium-based browser |
| Userscript manager | [Tampermonkey](https://www.tampermonkey.net/) (recommended) or [Greasemonkey](https://www.greasespot.net/) |
| Granted APIs | `GM_setClipboard`, `GM_registerMenuCommand` |

---

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or Greasemonkey) in your browser.
2. Open the Tampermonkey dashboard and create a new script.
3. Paste the entire contents of `linkedin-learning-task-exporter.user.js` into the editor.
4. Save the script (Ctrl+S / Cmd+S).
5. Navigate to any LinkedIn Learning course page. The floating **Export modules** button should appear in the bottom-right corner.

---

## Usage

1. Open a LinkedIn Learning course in the browser (the player page at `https://www.linkedin.com/learning/*`).
2. Click the blue **Export modules** button in the bottom-right corner of the page.

<img width="1903" height="911" alt="image" src="https://github.com/user-attachments/assets/ad0402bd-1c06-4bb5-b107-e4c04a69faee" />



3. In the panel that appears:
   - Choose a **Format** from the dropdown.
   - Toggle **Include durations**, **Prefix each line with course title**, or **Course title as top-level parent** as needed.
   - Click **Scrape** to extract the course contents.
4. Review the output in the textarea.
5. Click **Copy** to send the text to your clipboard.
6. Paste the result into Todoist, Habitica, Notion, or your preferred task manager.

<img width="1911" height="869" alt="image" src="https://github.com/user-attachments/assets/e51206a3-915f-41d6-95d5-2f17465ad182" />

<img width="1919" height="920" alt="image" src="https://github.com/user-attachments/assets/49f186bf-3617-46b7-bdf2-b8f6a2f62795" />

---

## Export Format Examples

Given a course with two sections and a few videos each:

### Nested (Todoist)

```
Section 1: Introduction
  Welcome to the course
  Setting up your environment
Section 2: Core Concepts
  Variables and data types
  Control flow
```

### Flat List (Habitica)

```
Welcome to the course
Setting up your environment
Variables and data types
Control flow
```

### Numbered

```
01. Welcome to the course
02. Setting up your environment
03. Variables and data types
04. Control flow
```

### Sections Only

```
Section 1: Introduction
Section 2: Core Concepts
```

---

## Options Reference

| Option | Effect |
|---|---|
| **Include durations** | Appends the video duration in parentheses, e.g. `Variables and data types (4m 32s)` |
| **Prefix each line with course title** | Prepends the course name to every line for multi-course imports |
| **Course title as top-level parent** | (Nested format only) Adds the course title as the root-level task with sections indented below |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Nothing found" after scraping | Make sure the **Contents** sidebar is visible on the LinkedIn Learning player. If it is hidden, open it before clicking **Scrape**. |
| Button does not appear | Confirm the userscript is enabled in Tampermonkey. Check that the URL matches `https://www.linkedin.com/learning/*`. |
| Clipboard copy fails | Some browsers restrict clipboard access on certain pages. Try the Tampermonkey menu command ("Export modules") instead, which uses the `GM_setClipboard` API. |
| Selectors break after a LinkedIn update | The script includes multiple fallback selectors, but LinkedIn may introduce entirely new markup. Open an issue or update the `SEL` object at the top of the script with the new class names. |

---

## How It Works

1. **Expand** -- The script programmatically clicks any collapsed section toggle buttons so all content is visible in the DOM.
2. **Scrape** -- It walks the table-of-contents sidebar, matching section headings and individual video items using a priority list of CSS selectors.
3. **Clean** -- Extracted text is sanitized: prefixes like "Video:", trailing durations, and status labels ("Viewed", "In progress") are stripped.
4. **Format** -- The cleaned data is assembled into the chosen output format.
5. **Copy** -- The formatted text is placed on the clipboard via `GM_setClipboard` (with a `navigator.clipboard` fallback).

---

## Example for todoist

<img width="1887" height="925" alt="image" src="https://github.com/user-attachments/assets/3c7ab5f8-40df-4e28-9ab1-fd16dc0c078e" />

<img width="1773" height="876" alt="image" src="https://github.com/user-attachments/assets/765ae56f-f53a-47ac-8912-5978cde5c570" />


## License

This project is provided as-is for personal productivity use.

---

## Contributing

Contributions are welcome! If LinkedIn changes their DOM structure and the script breaks, feel free to:

1. Inspect the new class names in DevTools.
2. Update the relevant arrays in the `SEL` object.
3. Submit a pull request with the fix.
