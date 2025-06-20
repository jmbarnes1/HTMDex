//import { toggleModal } from "./modules/modal.js";
import { focusAndSelectElement, userConfirm, createLogger, getReferrerParams } from "./modules/utils.js";
import { initHTMXHandler } from "./modules/htmxhandler.js";

// Initalize custom console logger.
window.consoleCustomLog = createLogger(true);

// Useful to work with HTML fragments delivered by HTMX.
window.getReferrerParams = getReferrerParams;

// Open the database once.  No need to continually reopen.
window.dexieDatabaseRegistry = new Dexie('dexieDatabaseRegistry');
dexieDatabaseRegistry.version(1).stores({
    databaseRegistry: `++id, databaseName, databaseAlias, date, time`,
    tableRegistry: `++id, tableName, tableAlias, databaseRecordKey, date, time`,
    fieldRegistry: `++id, fieldName, fieldAlias, tableRecordKey, databaseRecordKey, data, time`
});

await dexieDatabaseRegistry.open();

// This will hold active instances.
window.activeDB = null;
window.activeTable = null;


//Initialize the fragments handler.
initHTMXHandler();

// Event handlers
const handlers = {
    newDatabase : handleNewDatabase,
    renameDatabase : handleRenameDatabase,
    deleteDatabase : handleDeleteDatabase,
    newTable : handleNewTable,
    renameTable : handleRenameTable,
    deleteTable : handleDeleteTable,
    newField : handleNewField,
    renameField : handleRenameField,
    deleteField : handleDeleteField,
    saveRecord : handleSaveRecord,
    deleteRecord : handleDeleteRecord
}

// Handle actions  
// Use the handlers variables
document.addEventListener (
    'click', 
    (event) => 
    {
        // Handle the modal action button.
        if (event.target.id === "modalButton") {
            
            const modalButton = document.getElementById("modalButton");
            const action = modalButton.getAttribute("data-action");

            //Route the action if it exists.
            if (action) {
                if (handlers[action]) 
                {
                    handlers[action]();
                }
            }
        } else {
            
            //Get the action if it exists.
            const actionElement = event.target.closest('[data-action]');
        
            //Route the action if it exists.
            if (actionElement) 
            {
                console.log("actionElement");
                
                const action = actionElement.dataset.action;
                if (handlers[action]) 
                {
                    event.stopPropagation();
                    handlers[action](event, actionElement);
                }
            }
        }
    }
);


function handleNewDatabase() {

    consoleCustomLog("\n\n\n**********\n","The function handleNewDatabase was called.");

    // What's the name of the database?
    const databaseAlias = document.getElementById("profileInput").value;

    // Does the database exist?  If so, warn the user.
    checkDBExists(databaseAlias).then ( exists => {
        
        console.log("exists:  ",exists);

        if (exists === true) {
            // Get modal elements.
            const modalContent = document.getElementById("modalContent");
            const modalButton = document.getElementById("modalButton");

            modalContent.innerHTML = "";
            modalButton.innerText = "CLOSE";            
            
            const warningAlert = document.createElement("div");
            warningAlert.classList.add("alert","alert-warning","text-center");
            warningAlert.innerHTML = `THE DATABASE ${databaseAlias} ALREADY EXISTS`;

            modalContent.append(warningAlert);
        } else {

            const currentDate = new Date();
            const databaseName = "db" + currentDate.getTime();
            console.log(databaseName);
            
            // Open the registry database and add metadata.
            dexieDatabaseRegistry.databaseRegistry.add({
                databaseName: databaseName,
                databaseAlias: databaseAlias,
                date: new Date().toLocaleString(),
                time: new Date().toLocaleTimeString()
            }).then(() => {
                closeModal(document.getElementById("universalModal"));
                htmx.ajax("GET","./fragments/hxDatabases.html","#mainContent");

            }).catch((error) => {
                    console.error("Error:", error);
            })
        }
    })
}


// async function getTableContextFromURL() {
//     const urlParams = new URLSearchParams(window.location.search);
//     const tableRecordKey = Number(urlParams.get("tableRecordKey"));
//     const databaseRecordKey = Number(urlParams.get("databaseRecordKey"));

//     const tableRecord = await dexieDatabaseRegistry.tableRegistry.get(tableRecordKey);
//     const databaseRecord = await dexieDatabaseRegistry.databaseRegistry.get(databaseRecord.databaseRecordKey);
//     const fieldRegistry = await dexieDatabaseRegistry.fieldRegistry.where("tableRecordKey").equals(tableRecordKey).sortBy('fieldName');

//     return { databaseRecord, tableRecord, fieldRegistry, tableRecordKey };
// }



async function getTableContextFromURL() {
    const urlParams = new URLSearchParams(window.location.search);

    const databaseRecordKeyRaw = urlParams.get("databaseRecordKey");
    const tableRecordKeyRaw = urlParams.get("tableRecordKey");

    const result = {
        databaseRecordKey: null,
        tableRecordKey: null,
        databaseRecord: null,
        tableRecord: null,
        fieldRegistry: [],
    };

    if (databaseRecordKeyRaw) {
        const databaseRecordKey = Number(databaseRecordKeyRaw);
        result.databaseRecordKey = databaseRecordKey;
        result.databaseRecord = await dexieDatabaseRegistry.databaseRegistry.get(databaseRecordKey);
    }

    if (tableRecordKeyRaw) {
        const tableRecordKey = Number(tableRecordKeyRaw);
        result.tableRecordKey = tableRecordKey;

        const tableRecord = await dexieDatabaseRegistry.tableRegistry.get(tableRecordKey);
        result.tableRecord = tableRecord;

        if (tableRecord) {
            result.databaseRecordKey = result.databaseRecordKey ?? tableRecord.databaseRecordKey;
            result.databaseRecord = result.databaseRecord ??
                await dexieDatabaseRegistry.databaseRegistry.get(tableRecord.databaseRecordKey);

            result.fieldRegistry = await dexieDatabaseRegistry.fieldRegistry
                .where("tableRecordKey")
                .equals(tableRecordKey)
                .sortBy("fieldName");
        }
    }

    return result;
}


async function handleRenameDatabase() {
    console.log("\n\n\n**********\nThe function handleRenameDatabase has been called.");
    
    let urlParams = new URLSearchParams(window.location.search);
    let databaseRecordKey = Number(urlParams.get('databaseRecordKey')); 

    // What's the name of the database?
    const profileInput = document.getElementById("profileInput");
    const newDatabaseAlias = profileInput.value;

    await checkDBExists(newDatabaseAlias).then( exists => {
        
       consoleCustomLog("Rename database.  Does it exists?  ",exists);

        if (exists === true) {
            // Get modal elements.
            const modalContent = document.getElementById("modalContent");
            const modalButton = document.getElementById("modalButton");

            modalContent.innerHTML = "";
            modalButton.innerText = "CLOSE";
            modalButton.onclick = toggleModal;
            modalButton.dataset.action = "";
            
            const warningAlert = document.createElement("div");
            warningAlert.classList.add("alert","alert-warning","text-center");
            warningAlert.innerHTML = `THE DATABASE "${newDatabaseAlias}" ALREADY EXISTS`;

            modalContent.append(warningAlert);
        } else {

            // Load the record with key.
            dexieDatabaseRegistry.databaseRegistry.get(databaseRecordKey).then ( record => {
                
                if (record) {
                    // Modify the databaseName property.
                    record.databaseAlias = newDatabaseAlias; // Set the new value.
                    
                    // Save the updated record.
                    return dexieDatabaseRegistry.databaseRegistry.put(record);
                } else {
                    console.error("Record not found.");
                }
            }).then(() => {

                closeModal(document.getElementById("universalModal"));
                htmx.ajax("GET","./fragments/hxDatabases.html","#mainContent");

            }).catch(error => {
                console.error("Error updating record:", error);
            });
        }
    })
}


async function handleDeleteDatabase(event, actionElement) {

    if (userConfirm()) {

        consoleCustomLog("\n\nDelete database has been called.");
        
        // Get the database key.
        const databaseRecordKey = Number(actionElement.dataset.databaserecordkey);
        consoleCustomLog("\n\ndatabaseRecordKey:  ",databaseRecordKey);

        const tableArray = await dexieDatabaseRegistry
            .tableRegistry
            .where("databaseRecordKey")
            .equals(Number(databaseRecordKey))
            .toArray();
        consoleCustomLog("tableArray:  ",tableArray);
        
        // Delete the fields.
        // For each does NOT work with await.
        for (const table of tableArray) {
            consoleCustomLog(table.id);

            // Clean out the fields.
            let resultOfDelete = await dexieDatabaseRegistry
                .fieldRegistry
                .where("tableRecordKey")
                .equals(Number(table.id))
                .delete();
            consoleCustomLog("Fields resultOfDelete:  ",resultOfDelete);
        }

        // Clean out the tables.
        let resultOfDelete = await dexieDatabaseRegistry
            .tableRegistry
            .where("databaseRecordKey")
            .equals(Number(databaseRecordKey))
            .delete();
        consoleCustomLog("Tables resultOfDelete:  ",resultOfDelete);

        // Delete the database.
        // Get the name of the database.  This is used for the final delete below.
        const databaseInfo = await dexieDatabaseRegistry
             .databaseRegistry
             .where("id")
             .equals(Number(databaseRecordKey))
             .toArray();
        const databaseName = databaseInfo[0].databaseName;

        // Clean the database out of the registry.
        dexieDatabaseRegistry.table('databaseRegistry').delete(Number(databaseRecordKey));

        // Delete the actual database.
        resultOfDelete = indexedDB.deleteDatabase(databaseName);

        consoleCustomLog("Database resultOfDelete:  ",resultOfDelete);

        htmx.ajax("GET","./fragments/hxDatabases.html","#mainContent");
    } 
}


async function checkDBExists(databaseAlias) {

    return dexieDatabaseRegistry.databaseRegistry.where("databaseAlias").equals(databaseAlias).count().then(count => {
        return count > 0;
    });
}


function handleNewTable() {

    console.log("The function handleNewTable has been called.");

    // What's the name of the table?
    const profileInput = document.getElementById("profileInput");
    const tableAlias = profileInput.value;

    // Get params from URL.
    let urlParams = new URLSearchParams(window.location.search);
    //let databaseName = urlParams.get('database'); 
    let databaseRecordKey = Number(urlParams.get('databaseRecordKey'));

    // Get a unique name for the table.
    const currentDate = new Date();
    const tableName = "t" + currentDate.getTime();

    // Open the registry database and add metadata.
    dexieDatabaseRegistry.tableRegistry.add({
        tableName : tableName,
        tableAlias : tableAlias,
        databaseRecordKey : databaseRecordKey,
        date : new Date().toLocaleString(),
        time : new Date().toLocaleTimeString()
    }).then(() => {
        closeModal(document.getElementById("universalModal"));
        
        //htmx.ajax("GET",`./fragments/hxTables.html?database=${databaseName}&databaseRecordKey=${databaseRecordKey}`,"#mainContent");
        htmx.ajax("GET",`./fragments/hxTables.html?databaseRecordKey=${databaseRecordKey}`,"#mainContent");

    }).catch((error) => {
        console.error("Error:", error);
    })

    closeModal(document.getElementById("universalModal"));
}


async function handleRenameTable() {
    console.clear();
    console.log("The function handleRenameTable has been called.");

    let urlParams = new URLSearchParams(window.location.search);
    let databaseName = urlParams.get('database'); 
    let databaseRecordKey = Number(urlParams.get('databaseRecordKey')); 
    let tableRecordKey = Number(urlParams.get("tableRecordKey"));

    // Get new table name from input
    const profileInput = document.getElementById("profileInput");
    const newTableAlias = profileInput.value.trim();

    if (!newTableAlias) {
        console.error("New table name cannot be empty.");
        return;
    }

    dexieDatabaseRegistry.table('tableRegistry').update(tableRecordKey, {tableAlias: newTableAlias}).then(
        () => {
            closeModal(document.getElementById("universalModal"));
            htmx.ajax("GET",`./fragments/hxTables.html?database=${databaseName}&databaseRecordKey=${databaseRecordKey}`,"#mainContent");
        }
    )
}


function handleDeleteTable(event, actionElement) {

    console.clear();
    console.log("The function handleDeleteTable has been called.");

    if (userConfirm()) {
        dexieDatabaseRegistry.table('tableRegistry').delete(Number(actionElement.dataset.tablerecordkey));

        htmx.ajax("GET",`./fragments/hxTables.html?databaseRecordKey=${actionElement.dataset.databaserecordkey}`,"#mainContent");
    }

}


function handleNewField() {

    console.clear();
    console.log("The function handleNewField has been called.");

    // What's the name of the field?
    const fieldAlias = document.getElementById("profileInput").value;

    // Get params from URL.
    let urlParams = new URLSearchParams(window.location.search);
    let databaseRecordKey = Number(urlParams.get('databaseRecordKey')); 
    let tableRecordKey = Number(urlParams.get('tableRecordKey'));

    const currentDate = new Date();
    const fieldName = "f" + currentDate.getTime();
    console.log(fieldName);
    
    // Open the registry database and add metadata.
    dexieDatabaseRegistry.fieldRegistry.add({
        fieldName: fieldName,
        fieldAlias: fieldAlias,
        tableRecordKey: tableRecordKey,
        date: new Date().toLocaleString(),
        time: new Date().toLocaleTimeString()
    }).then(() => {
        closeModal(document.getElementById("universalModal"));
        htmx.ajax("GET",`./fragments/hxFields.html?databaseRecordKey=${databaseRecordKey}&tableRecordKey=${tableRecordKey}`,"#mainContent");

    }).catch((error) => {
        console.error("Error:", error);
    })

}


function handleRenameField () {

    console.clear();
    console.log("The function handleRenameField has been called.");

    let urlParams = new URLSearchParams(window.location.search);
    let tableRecordKey = Number(urlParams.get("tableRecordKey"));
    let fieldRecordKey = Number(urlParams.get('fieldRecordKey')); 

    // Get new table name from input
    const profileInput = document.getElementById("profileInput");
    const newFieldAlias = profileInput.value.trim();

    if (!newFieldAlias) {
        console.error("New field name cannot be empty.");
        return;
    }

    dexieDatabaseRegistry.table('fieldRegistry').update(fieldRecordKey, {fieldAlias: newFieldAlias}).then(
        () => {
            closeModal(document.getElementById("universalModal"));
            htmx.ajax("GET",`./fragments/hxFields.html?tableRecordKey=${tableRecordKey}`,"#mainContent");
        }
    )

}


function handleDeleteField (event, actionElement) {

    consoleCustomLog("\n\n\n**********\nThe function handleDeleteField has been called.");

    if (userConfirm()) {
        dexieDatabaseRegistry.table('fieldRegistry').delete(Number(actionElement.dataset.fieldrecordkey));

        htmx.ajax("GET",`./fragments/hxFields.html?tableRecordKey=${actionElement.dataset.tablerecordkey}`,"#mainContent");
    }
}


async function handleSaveRecord (event, actionElement) {

    console.log("\n\n**********\nThe function handleSaveRecord has been called.");

    let urlParams = new URLSearchParams(window.location.search);
    let databaseRecordKey = Number(urlParams.get('databaseRecordKey')); 
    let tableRecordKey = Number(urlParams.get("tableRecordKey"));

    //Get the form.
    const recordForm = document.getElementById('recordForm');
    console.log("\nrecordForm:  ",recordForm);

    // Get field data for the form.
    // Returns a FormData object.
    const formData = new FormData(recordForm);

    // The fromEntries() method creates an object from a list of key/value pairs.
    let formDataObject = Object.fromEntries
    (
        Array.from
        (
            formData.keys()
        ).map
        (
            key => [key, formData.getAll(key).length > 1 ? formData.getAll(key) : formData.get(key)]
        )
    )

    const tableRecord = await dexieDatabaseRegistry.tableRegistry.get(tableRecordKey);
    const databaseRecord = await dexieDatabaseRegistry.databaseRegistry.get(databaseRecordKey);

    // Remove id if it's in the list so that ++id is in the list.
    const fieldsArray = Object.keys(formDataObject).filter(f => f !== 'id');
    const fieldsList = "++id,"+fieldsArray.join(",");

    console.log("fieldsList:  ", fieldsList)

    // Open the database.
    let db = new Dexie(databaseRecord.databaseName);
    db.version(1).stores({
        [tableRecord.tableName] : fieldsList
    });

    // Get the primary key name.
    let primaryKey = db[tableRecord.tableName].schema.primKey.name;

    // Get the table that will be updated.
    let table = db[tableRecord.tableName];
    
    // If formDataObject has a key, then it is an update.  Else, it is an insert.
    let hasKey = Object.keys(formDataObject).includes(primaryKey); 

    consoleCustomLog("\ndb:  ",db,"\n\nfieldList:  ",fieldsList,"\nprimaryKey:  ", primaryKey, "\n\ntable:  ",table,"\nhasKey:  ",hasKey)

    if (hasKey) {
        // Attempt update.
        const primaryKeyValue = Number(formDataObject[primaryKey]);

        delete formDataObject[primaryKey];

        const updated = await table.update(primaryKeyValue, formDataObject);

        consoleCustomLog(`Record with key ${primaryKey}:${primaryKeyValue} updated in the table ${table}.`);
    } else {
        // Insert without specifying key (auto-increment assumed).
        const hold = {...formDataObject}
        console.log("hold:  ",hold);
        const newKey = await table.add({ ...formDataObject });
        
        consoleCustomLog(`Record inserted in to the table ${table} with generated key ${newKey}.`);
    }

    closeModal(document.getElementById("universalModal"));
    htmx.ajax("GET",`./fragments/hxViewData.html?tableRecordKey=${tableRecordKey}`,"#mainContent");
}


async function handleDeleteRecord(event, actionElement) {
   
    console.clear();
    consoleCustomLog("The function handleDeleteRecord has been called.");

    if (userConfirm()) {
        
        consoleCustomLog(window.activeDB);
        //const key = Number(actionElement.dataset.key);
        const key = Number(actionElement.dataset.key);

        let urlParams = new URLSearchParams(window.location.search);
        let databaseRecordKey = Number(urlParams.get('databaseRecordKey')); 
        let tableRecordKey = Number(urlParams.get("tableRecordKey"));

        // Get the data for the table and database being used.
        const tableRecord = await dexieDatabaseRegistry.tableRegistry.get(tableRecordKey);
        const databaseRecord = await dexieDatabaseRegistry.databaseRegistry.get(tableRecord.databaseRecordKey);

        // Open the database.
        let db = new Dexie(databaseRecord.databaseName);
        db.version(1).stores({
            [tableRecord.tableName]: 'id++'
        });

        await db[tableRecord.tableName].delete(key);

        htmx.ajax("GET",`./fragments/hxViewData.html?tableRecordKey=${tableRecordKey}`,"#mainContent");
    }
}

function formatCell (value) 
{
    return value !== null && value !== undefined ? value : '';
};

//Dynamically create a table.
window.createTableFromJSON = async function (data,databaseRecordKey,tableRecordKey)  
{
    
    consoleCustomLog("\n\nThe function createTableFromJSON has been called.\n\n");

    consoleCustomLog("Data:  ",data);
    
    //Ensure the array is not empty.
    if (!data || data.length === 0) 
    {
        return '<article class="class="pico-background-red"">NO DATA!</article>';
    }

    // Get all fields for the table.
    let fieldRegistry = await dexieDatabaseRegistry
        .fieldRegistry
        .where("tableRecordKey")
        .equals(tableRecordKey)
        .sortBy('fieldAlias');
    let fieldNameList = fieldRegistry.map(({ fieldName }) => fieldName);
    fieldNameList.unshift('id');
    let fieldAliasList = fieldRegistry.map(({ fieldAlias }) => fieldAlias);
    fieldAliasList.unshift('id');

    //Generate the table shell with dynamic headers.
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    ${fieldAliasList.map(fld => `<th>${fld}</th>`).join('')}
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr> 
                        ${fieldNameList.map(fld => `<td>${formatCell(row[fld])}</td>`).join('')}
                        <td class="text-center">
                            <i class="bx bx-pencil pointer"
                                onclick="toggleModal(event)"
                                data-key="${row["id"]}"
                                data-target="universalModal"
                                data-buttonaction="saveRecord" 
                                data-caption="SAVE"
                                hx-target="#modalContent" 
                                hx-trigger="click" 
                                hx-get="./fragments/hxRecord.html" 
                                hx-push-url="index.html?databaseRecordKey=${databaseRecordKey}&tableRecordKey=${tableRecordKey}&id=${row["id"]}"
                                hx-swap="innerHTML"></i>
                            <i class="ps-1 bx bx-trash pointer"
                                data-key="${row["id"]}"
                                data-action="deleteRecord"></i>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;

    return tableHTML;
};