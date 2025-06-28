//Simple confirm.  Used with deletes normally.
export function userConfirm(message = 'Are you sure?') {
    return confirm(message);
}


export function createLogger(enabled = true) {
    return function log(...args) {
        if (enabled) console.log(...args);
    };
}

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


export async function incrementSchemaVersion(database, tableRecordKey) {
    database
        .get(tableRecordKey)
        .then (
            table => {
                table.schemaVersion = (table.schemaVersion || 1) + 1;
                dexieDatabaseRegistry.tableRegistry.put(table);
            }
        );
}
