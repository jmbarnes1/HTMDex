import { userConfirm, createLogger, getParams, incrementSchemaVersion, createWarning, formatCell, logFunctionStart } from "./modules/utils.js";
import { toggleModal, closeModal } from './modules/modal.js';
import { initHTMXHandler } from "./modules/htmxhandler.js";
import { generateCSV, downloadCSV } from "./modules/csv.js";


// Initalize custom console logger.  Pass false to turn it off.
window.consoleCustomLog = createLogger(true);

// Open the database once.  No need to continually reopen.
window.dexieDatabaseRegistry = new Dexie('dexieDatabaseRegistry');
dexieDatabaseRegistry.version(1).stores({
    databaseRegistry: `++id, databaseName, databaseAlias, date, time`,
    tableRegistry: `++id, tableName, tableAlias, databaseRecordKey, date, time`,
    fieldRegistry: `++id, fieldName, fieldAlias, tableRecordKey, databaseRecordKey, data, time`
});
await dexieDatabaseRegistry.open();

//Initialize the universal modal.
var universalModal = document.getElementById("universalModal");

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
    deleteRecord : handleDeleteRecord,
    exportCSV : handleExportCSV
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
        } else if (event.target.dataset.togglemodal) {
            if (event.target.dataset.togglemodal === "true") {
                toggleModal(event);
            }
        }
        else {
            
            //Get the action if it exists.
            const actionElement = event.target.closest('[data-action]');
        
            //Route the action if it exists.
            if (actionElement) 
            {
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

    logFunctionStart("handleNewDatabase");

    // What's the name of the database?
    const databaseAlias = document.getElementById("profileInput").value;

    // Does the database exist?  If so, warn the user.
    checkDBExists(databaseAlias).then ( exists => {

        if (exists === true) {
            // Get modal elements.
            const modalContent = document.getElementById("modalContent");
            const modalButton = document.getElementById("modalButton");

            modalContent.innerHTML = "";
            modalButton.innerText = "CLOSE";            
            
            const warning = createWarning(`THE DATABASE ${databaseAlias} ALREADY EXISTS`)

            modalContent.append(warning);
        } else {

            const currentDate = new Date();
            const databaseName = "db" + currentDate.getTime();
            
            // Open the registry database and add metadata.
            dexieDatabaseRegistry.databaseRegistry.add({
                databaseName: databaseName,
                databaseAlias: databaseAlias,
                date: new Date().toLocaleString(),
                time: new Date().toLocaleTimeString()
            }).then(() => {

                //Close the modal and relocate.
                closeModal(universalModal);
                htmx.ajax("GET","./fragments/hxDatabases.html","#mainContent");

            }).catch((error) => {
                    console.error("There was an error creating a new database:", error);
            })
        }
    })
}


// Deal with renaming a database.
async function handleRenameDatabase() {
    
    logFunctionStart("handleRenameDatabase");
    
    // Get params from the URL.
    const params = getParams(); 
    const databaseRecordKey = params.databaseRecordKey; 

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
            
            const warning = createWarning(`THE DATABASE "${newDatabaseAlias}" ALREADY EXISTS`);

            modalContent.append(warning);
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

                //Close the modal and relocate.
                closeModal(universalModal);
                htmx.ajax("GET","./fragments/hxDatabases.html","#mainContent");

            }).catch(error => {
                console.error("There was an error updating the following record:", error);
            });
        }
    })
}


async function handleDeleteDatabase(event, actionElement) {

    logFunctionStart("handleDeleteDatabase");
    
    if (userConfirm()) {
        
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


// Check if a database exists in the registry.
async function checkDBExists(databaseAlias) {

    return dexieDatabaseRegistry.databaseRegistry.where("databaseAlias").equals(databaseAlias).count().then(count => {
        return count > 0;
    });
}


// Deal with create a new table.  Add to registry.
function handleNewTable() {

    logFunctionStart("handleNewTable");

    // Get params from the URL.
    const params = getParams(); 
    const databaseRecordKey = params.databaseRecordKey; 

    // What's the name of the table?
    const profileInput = document.getElementById("profileInput");
    const tableAlias = profileInput.value;

    // Get a unique name for the table.
    const currentDate = new Date();
    const tableName = "t" + currentDate.getTime();

    // Open the registry database and add metadata.
    dexieDatabaseRegistry.tableRegistry.add({
        tableName : tableName,
        tableAlias : tableAlias,
        databaseRecordKey : databaseRecordKey,
        schemaVersion : 0,
        date : new Date().toLocaleString(),
        time : new Date().toLocaleTimeString()
    }).then(() => {

        //Close the modal and relocate.
        closeModal(universalModal);
        htmx.ajax("GET",`./fragments/hxTables.html?databaseRecordKey=${databaseRecordKey}`,"#mainContent");

    }).catch((error) => {
        console.error("Error:", error);
    })
}


// Rename a table in the table registry.
async function handleRenameTable() {
    
    logFunctionStart("handleRenameTable");

    const params = getParams();
    const databaseRecordKey = params.databaseRecordKey; 
    const tableRecordKey = params.tableRecordKey;
    const databaseName = params.database;

    // Get new table name from input
    const profileInput = document.getElementById("profileInput");
    const newTableAlias = profileInput.value.trim();

    if (!newTableAlias) {
        console.error("New table name field cannot be empty!");
        return;
    }

    dexieDatabaseRegistry.table('tableRegistry').update(tableRecordKey, {tableAlias: newTableAlias}).then(
        () => {

            //Close the modal and relocate.
            closeModal(universalModal);
            htmx.ajax("GET",`./fragments/hxTables.html?database=${databaseName}&databaseRecordKey=${databaseRecordKey}`,"#mainContent");
        }
    )
}


// Delete a table.
async function handleDeleteTable(event, actionElement) {

    logFunctionStart("handleDeleteTable");

    if (userConfirm()) {

        const databaseRecordKey = Number(actionElement.dataset.databaserecordkey);
        const tableRecordKey = Number(actionElement.dataset.tablerecordkey);
        
        const databaseRecord = await dexieDatabaseRegistry.databaseRegistry.get(databaseRecordKey);
        const tableRecord = await dexieDatabaseRegistry.tableRegistry.get(tableRecordKey);

        consoleCustomLog("\nDelete this table:  ", tableRecord.tableName);

        // Get all fields for the table.
        let fieldRegistry = await dexieDatabaseRegistry
            .fieldRegistry
            .where("tableRecordKey")
            .equals(tableRecordKey)
            .sortBy('fieldAlias');
        
        let fieldList = fieldRegistry.map(({ fieldName }) => fieldName);
        fieldList.unshift("id");
        let fieldListString = fieldList.join(','); 

        let workingDB = new Dexie(databaseRecord.databaseName);
        
        const tableToClear = tableRecord.tableName;
        const version = Number(tableRecord.schemaVersion || 1);
        
        // You can't actually delete tables with indexed.db.
        // Open it up and clean out the data.
        workingDB.version(version).stores({[tableToClear] : fieldListString });
        await workingDB.open();
        await workingDB.table(tableToClear).clear();

        // Close it out.  IndexedDB and Dexie are sensitive to open connections.
        workingDB.close();

        // Clean out table and fields.
        await dexieDatabaseRegistry
            .table('tableRegistry')
            .delete(Number(actionElement.dataset.tablerecordkey));

        await dexieDatabaseRegistry.fieldRegistry
            .where("tableRecordKey")
            .equals(tableRecordKey)
            .delete();

        htmx.ajax("GET",`./fragments/hxTables.html?databaseRecordKey=${databaseRecordKey}`,"#mainContent");
    }
}


// Deal with adding a new field to the field registry.
async function handleNewField() {

    logFunctionStart("handleNewField");

    // What's the name of the field?
    const fieldAlias = document.getElementById("profileInput").value;

    // Get params from the URL.
    const params = getParams();

    // Get database information.
    const databaseRecordKey = params.databaseRecordKey;
    const tableRecordKey = params.tableRecordKey;

    const currentDate = new Date();
    const fieldName = "f" + currentDate.getTime();
    
    // Open the registry database and add metadata.
    await dexieDatabaseRegistry.fieldRegistry.add({
        fieldName: fieldName,
        fieldAlias: fieldAlias,
        tableRecordKey: tableRecordKey,
        date: new Date().toLocaleString(),
        time: new Date().toLocaleTimeString()
    })
    
    await incrementSchemaVersion(dexieDatabaseRegistry.tableRegistry, tableRecordKey)
    
    //Close the modal and relocate.
    closeModal(universalModal);
    htmx.ajax("GET",`./fragments/hxFields.html?databaseRecordKey=${databaseRecordKey}&tableRecordKey=${tableRecordKey}`,"#mainContent");
}


// Deal with renaming a field.
async function handleRenameField () {

    logFunctionStart("handleRenameField");
    
    // Get params from the URL.
    const params = getParams();

    // Get database information.
    const databaseRecordKey = params.databaseRecordKey;
    const tableRecordKey = params.tableRecordKey;
    const fieldRecordKey = params.fieldRecordKey;

    // Get new table name from input
    const profileInput = document.getElementById("profileInput");
    const newFieldAlias = profileInput.value.trim();

    if (!newFieldAlias) {
        console.error("New field name cannot be empty.");
        return;
    }

    await dexieDatabaseRegistry.table('fieldRegistry').update(fieldRecordKey, {fieldAlias: newFieldAlias})
    
    // Close the modal and relocate.
    closeModal(universalModal);
    htmx.ajax("GET",`./fragments/hxFields.html?databaseRecordKey=${databaseRecordKey}&tableRecordKey=${tableRecordKey}`,"#mainContent");
    
}


// Remove a field from a table.
async function handleDeleteField (event,actionElement) {

    logFunctionStart("handleDeleteField");

    if (userConfirm()) {

        dexieDatabaseRegistry.table('fieldRegistry').delete(Number(actionElement.dataset.fieldrecordkey));

        await incrementSchemaVersion(dexieDatabaseRegistry.tableRegistry, actionElement.dataset.tablerecordkey);

        htmx.ajax("GET",`./fragments/hxFields.html?tableRecordKey=${actionElement.dataset.tablerecordkey}`,"#mainContent");
    }
}


// Save a record via insert or update.
async function handleSaveRecord (event, actionElement) {

    logFunctionStart("handleSaveRecord");

    // Get params from the URL.
    const params = getParams();
    const databaseRecordKey = params.databaseRecordKey;
    const tableRecordKey = params.tableRecordKey;

    //Get the form.
    const recordForm = document.getElementById('recordForm');

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

    const fields = await dexieDatabaseRegistry.fieldRegistry
        .where("tableRecordKey")
        .equals(tableRecordKey)
        .toArray();

    const fieldNames = fields.map(f => f.fieldName);
    const fieldsList = "++id," + fieldNames.join(",");

    // Open the database.
    const version = Number(tableRecord.schemaVersion || 1);

    let workingDB = new Dexie(databaseRecord.databaseName);
    
    workingDB.version(version).stores({
        [tableRecord.tableName]: fieldsList
    });

    await workingDB.open();
    
    // Get the primary key name.
    const primaryKey = workingDB[tableRecord.tableName].schema.primKey.name;

    // Get the table that will be updated.
    let table = workingDB[tableRecord.tableName];
    
    // If formDataObject has a key, then it is an update.  Else, it is an insert.
    let hasKey = Object.keys(formDataObject).includes(primaryKey); 

    consoleCustomLog (
        "\nMetadata ",
        "\n========",
        "\ndatabase alias:  ",databaseRecord.databaseAlias,
        "\ndatabase name:  ",databaseRecord.databaseName,
        "\ntable alias:  ",tableRecord.tableAlias,
        "\ntable name:  ",tableRecord.tableName,
        "\nprimaryKey:  ", primaryKey,
        "\nhasKey:  ",hasKey,
        "\nfieldList:  ",fieldsList,
        "\nschemaVersion:  ", version,
        "\nformDataObject: ",formDataObject,
        "\n"
    )

    if (hasKey) {
        // Attempt update.
        const primaryKeyValue = Number(formDataObject[primaryKey]);

        // Take the key out so it doesn't interfere.
        delete formDataObject[primaryKey];

        const updated = await table.update(primaryKeyValue, formDataObject);
        
        consoleCustomLog(
            `\nRecord with key ${primaryKey}:${primaryKeyValue} updated in the table ${tableRecord.tableAlias}.`,
            '\nupdated:  ',updated);
    } else {

        // Insert without specifying key (auto-increment assumed).
        const newKey = await table.add(formDataObject);
        
        consoleCustomLog(`\nRecord inserted in to the table ${table} with generated key ${newKey}.`);
    }

    // Close the database.
    workingDB.close();

    //Close the modal and relocate.
    closeModal(universalModal);
    htmx.ajax("GET",`./fragments/hxViewData.html?tableRecordKey=${tableRecordKey}`,"#mainContent");
}


// Delete a record from a table.
async function handleDeleteRecord(event, actionElement) {
   
    logFunctionStart("handleDeleteRecord");

    if (userConfirm()) {
        
        // Get params from the URL.
        const params = getParams();

        let tableRecordKey = params.tableRecordKey;

        const key = Number(actionElement.dataset.key);

        // Get the data for the table and database being used.
        const tableRecord = await dexieDatabaseRegistry.tableRegistry.get(tableRecordKey);
        const databaseRecord = await dexieDatabaseRegistry.databaseRegistry.get(tableRecord.databaseRecordKey);

        const version = tableRecord.schemaVersion || 1;

        // Open the database.
        let workingDB = new Dexie(databaseRecord.databaseName);
        workingDB.version(version).stores({
            [tableRecord.tableName]: 'id++'
        });

        await workingDB[tableRecord.tableName].delete(key);
        workingDB.close();

        htmx.ajax("GET",`./fragments/hxViewData.html?tableRecordKey=${tableRecordKey}`,"#mainContent");
    }
}


//Dynamically create a table.
window.createTableFromJSON = async function (data,databaseRecordKey,tableRecordKey)  
{
    
    logFunctionStart("createTableFromJSON");
    
    //Ensure the array is not empty.
    if (!data || data.length === 0) 
    {
        return '<article class="pico-background-red-300 text-center">NO DATA!</article>';
    }

    // Get all fields for the table.
    let fieldRegistry = await dexieDatabaseRegistry
        .fieldRegistry
        .where("tableRecordKey")
        .equals(tableRecordKey)
        .toArray();

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
                                data-key="${row["id"]}"
                                data-target="universalModal"
                                data-togglemodal="true"
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


async function handleExportCSV(event, actionElement) {

    logFunctionStart("handleExportCSV");

    // Get params from the URL.
    const params = getParams();
    const databaseRecordKey = params.databaseRecordKey;
    const tableRecordKey = params.tableRecordKey;

    // Get the data for the table and database being used.
    const tableRecord = await dexieDatabaseRegistry.tableRegistry.get(tableRecordKey);
    const databaseRecord = await dexieDatabaseRegistry.databaseRegistry.get(databaseRecordKey);

    // Get all fields for the table.
    let fieldRegistry = await dexieDatabaseRegistry
        .fieldRegistry
        .where("tableRecordKey")
        .equals(tableRecordKey)
        .toArray();

    // Create a list of field names and aliases.
    let fieldNameList = fieldRegistry.map(({ fieldName }) => fieldName);
    fieldNameList.unshift('id');
    const fieldListString = fieldNameList.join(',');

    let fieldAliasList = fieldRegistry.map(({ fieldAlias }) => fieldAlias);
    fieldAliasList.unshift('id');

    // Open the database.
    const version = tableRecord.schemaVersion || 1;
    let workingDB = new Dexie(databaseRecord.databaseName);
    workingDB.version(version).stores({
        [tableRecord.tableName]: fieldListString
    });

    // Get data from the table.
    const csvData = await workingDB[tableRecord.tableName].toArray();
   
    consoleCustomLog("csvData:  ", csvData.length);
    // If there is no data, return early.
    if (csvData.length === 0) {

        alert (`NO DATA TO EXPORT FROM THE TABLE ${tableRecord.tableAlias}`);
        
        return;
    }

    // Close the database.
    workingDB.close();

    // Generate CSV content.
    const csvContent = generateCSV(csvData, fieldNameList, fieldAliasList);

    // Trigger download.
    downloadCSV(csvContent, `${databaseRecord.databaseAlias}_${tableRecord.tableAlias}.csv`);
}