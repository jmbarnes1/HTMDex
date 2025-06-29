//Simple confirm.  Used with deletes normally.
export function userConfirm(message = 'Are you sure?') {
    return confirm(message);
}

// Universal log function that can be turned on and off.
export function createLogger(enabled = true) {
    return function log(...args) {
        if (enabled) console.log(...args);
    };
}

// Extract values for the URL.
export function getParams() {

    const result = {
        databaseRecordKey: null,
        tableRecordKey: null,
        fieldRecordKey: null,
        id: null
    };

    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("databaseRecordKey")) {
        result.databaseRecordKey = Number(urlParams.get("databaseRecordKey"));
    }

    if (urlParams.get("tableRecordKey")) {
        result.tableRecordKey = Number(urlParams.get("tableRecordKey"));
    }

    if (urlParams.get("fieldRecordKey")) {
        result.fieldRecordKey = Number(urlParams.get("fieldRecordKey"));
    }

    if (urlParams.get("id")) {
        result.id = Number(urlParams.get("id"));
    }

    return result;
}

// Dexie needs tight versioning.  This allows some simple automation of that.
export async function incrementSchemaVersion(database, tableRecordKey) {

    const table = await database.get(tableRecordKey);
    if (!table) {
        consoleCustomLog("Table not found for recordKey:", tableRecordKey);
        return;
    }
    table.schemaVersion = (table.schemaVersion || 1) + 1;
    await dexieDatabaseRegistry.tableRegistry.put(table);
}

// Icons are created multiple times.  Simple standardization.
export function createIcon(attributes = {}, classList = []) {
    const icon = document.createElement("i");
    icon.classList.add(...classList);
    for (const [key, val] of Object.entries(attributes)) {
        icon.setAttribute(key, val);
    }
    
    return icon;
}

// Spans are created multiple times.  Simple standardization.
export function createSpan(attributes = {}, classList = []) {
    const span = document.createElement("span");
    span.classList.add(...classList);
    for (const [key, val] of Object.entries(attributes)) {
        span.setAttribute(key, val);
    }
    
    return span;
}



// Warnings are potentially created multiple times.  Simple standardization.
export function createWarning(message = "", classList = ["pico-background-red-300", "text-center"]) {
    const warning = document.createElement("article");
    warning.classList.add(...classList);
    //warning.classList.add("pico-background-red-300", "text-center");
    warning.textContent = message;
    
    return warning;
}


// Lot of HTMX usage brings in new elements.  HTMX needs to be directed add them to it's functionality.
export function processHTMX(...elements) {
    elements.forEach(el => {
        if (typeof el === "string") {
            htmx.process(document.querySelector(el));
        } else if (el instanceof Element) {
            htmx.process(el);
        }
    });
}