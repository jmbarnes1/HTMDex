# HTMDex

<img src="https://jmbarnes1.github.io/htmdex/icon.png" alt="HTMDex" width="200">
*A minimalist client-side app using HTMX and Dexie.js.*

## Overview

**HTMDex** is a lightweight, frontend-only application that blends [HTMX](https://htmx.org/) with the data handling of [Dexie.js](https://dexie.org/), styled with [PicoCSS](https://picocss.com/) and [Boxicons](https://boxicons.com/). Built as learning excerise.

## Features

- **HTMX-powered interactivity** – Dynamic updates via HTML attributes
- **Dexie.js integration** – IndexedDB wrapper for fast and persistent local data
- **PicoCSS styling** – Clean, semantic, and mobile-first CSS with no framework bloat
- **Boxicons support** – Beautiful, responsive icons using minimal markup

## Data Architecture & Registry System

HTMDex uses a layered abstraction on top of IndexedDB via Dexie.js, allowing for flexible and user-friendly data modeling.

### IndexedDB via Dexie

Dexie.js manages all IndexedDB interactions behind the scenes. All persistent data lives in a structured Dexie database that includes:

- `databaseRegistry`: Stores metadata about logical databases
- `tableRegistry`: Defines tables within those databases
- `fieldRegistry`: Tracks the fields (columns) associated with each table

### Alias-Based Design

Rather than editing or renaming actual database entries, HTMDex uses **aliases**:

- Each database, table, and field has a unique system ID (used internally)
- The user-facing **alias** is what's shown in the UI and editable
- Changing an alias updates only the registry, not the underlying data structure

This design offers:
- **Non-destructive renaming** (e.g., renaming a table without rebuilding it)
- **Loose coupling** between UI and storage
- **Improved traceability**, since system-level names remain stable

### Interaction Flow

1. The user creates a new database/table/field via the UI
2. A registry entry is created in Dexie
3. UI components display and interact via the alias layer
4. Updates to aliases are reflected in the UI instantly, with no change to stored records


## Live Demo

[Check out the live version](https://jmbarnes1.github.io/htmdex/)

## Technologies Used

- [HTMX](https://htmx.org/)
- [Dexie.js](https://dexie.org/)
- [PicoCSS](https://picocss.com/)
- [Boxicons](https://boxicons.com/)
- JavaScript

## Installation

To run HTMDex locally:

```bash
# Clone the repository
git clone https://github.com/jmbarnes1/htmdex.git
cd htmdex

# Open index.html in your browser

## Running Locally
To run LokiHTMX on your local machine, you need a simple web server. If you open `index.html` directly (using `file://`), some HTMX features may not work as expected.

## Usage
1. Open `index.html` in your preferred web browser.
2. Interact with the dynamic UI elements powered by HTMX and Dexie.js.
3. Data entered is **persistently stored in IndexedDB**.
4. Modify the project to fit your needs by editing the HTML, JS, or CSS files.


## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact
- **GitHub Repository:** [LokiHTMX Repo](https://github.com/jmbarnes1/lokihtmx)
- **Website:** [LokiHTMX](https://jmbarnes1.github.io/lokihtmx/)

---

Feel free to suggest edits or enhancements!