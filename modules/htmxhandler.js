import { getParams, createIcon, createSpan, createWarning, processHTMX, logFunctionStart } from "./utils.js";
import { toggleModal, initModalListeners } from './modal.js';

// Handle the page hxDatabases.html, which is loaded by HTMX.
async function handleDatabases() {

    logFunctionStart("handleDatabases");

    const databaseList = document.getElementById("databaseList");

    // Clean up.
    databaseList.innerHTML = "";

    const dbCount = await dexieDatabaseRegistry.databaseRegistry.count();

    if (dbCount === 0) {
        
        const warning = createWarning("NO DATABASES DEFINED YET!")
        databaseList.append (warning);

        return
    }
    
    //Loop over entries.
    dexieDatabaseRegistry.databaseRegistry.each ( databaseDocument => {

        // List item to hold database information.
        const databaseListItem = document.createElement("li");

        // Create a container to hold the database info.
        const databaseNameSpan = createSpan({
            "hx-get" : "./fragments/hxTables.html",
            "hx-target" : "#mainContent",
            "hx-swap" : "innerHTML",
            "hx-trigger" : "click",
            "hx-push-url" : `index.html?databaseRecordKey=${databaseDocument.id}`},
            ["pointer"]);
        databaseNameSpan.textContent = databaseDocument.databaseAlias;

        const dbIcon = createIcon({},["m-1","bx","bx-data"]);

        const trashIcon = createIcon({
            "data-action" : "deleteDatabase",
            "data-database" : databaseDocument.databaseName,
            "data-databaserecordkey" : databaseDocument.id},
            ["m-1","float-end","pointer","bx","bx-trash"]);

        const pencilIcon = createIcon({
            "data-database" : databaseDocument.databaseName,
            "data-databaseRecordKey" : databaseDocument.id,
            "data-togglemodal":"true",
            "data-target" : "universalModal",        
            "data-title" : "RENAME DATABASE",
            "data-buttonaction" : "renameDatabase",
            "data-caption" : "RENAME",
            "hx-target" : "#modalContent", 
            "hx-trigger" : "click",
            "hx-get" : `fragments/hxProfile.html?database=${databaseDocument.databaseName}&databaseRecordKey=${databaseDocument.id}`,
            "hx-swap" : "innerHTML",
            "hx-push-url" : `index.html?database=${databaseDocument.databaseName}&databaseRecordKey=${databaseDocument.id}`
            },
            ["m-1","float-end","pointer","bx","bx-edit"]);
        
        // Put the list item together.
        databaseListItem.prepend(dbIcon);
        databaseListItem.append(databaseNameSpan);
        databaseListItem.append(trashIcon);
        databaseListItem.append(pencilIcon);

        databaseList.append(databaseListItem);
        
        // Make sure HTMX works with the new items.
        processHTMX(pencilIcon, databaseListItem);
    });
}


// Handle the page hxProfile.html, which is loaded by HTMX.
async function handleProfile() { 

    logFunctionStart("handleProfile");

    const profileInput = document.getElementById('profileInput');
    
    if (profileInput) {
        profileInput.focus();
        profileInput.select();
    }
}


// Handle the page hxTables.html, which is loaded by HTMX.
async function handleTables() 
{
    logFunctionStart("handleTables");
    
    // Get params from the URL.
    const params = getParams();

    // Get database information.
    const databaseRecordKey = params.databaseRecordKey;
    const databaseRecord = await dexieDatabaseRegistry.databaseRegistry.get(databaseRecordKey)
    const databaseAlias = databaseRecord.databaseAlias;

    // Get tables.
    const tableRegistry =  await dexieDatabaseRegistry.tableRegistry.where("databaseRecordKey").equals(databaseRecordKey).sortBy('tableName');

    // Display the name of the database.
    document.getElementById("holdDatabaseAlias").textContent = databaseAlias;

    const tablesList = document.getElementById("tablesList");

    // If there aren't any tables, display a warning note.
    if (tableRegistry.length === 0) {
        
        const warning = createWarning("NO TABLES DEFINED YET!")
        tablesList.append (warning);

        return
    }

    // Output the schema of each table.
    tableRegistry.forEach( function (table) {

        // List item to hold table information.
        const tableListItem = document.createElement("li");

        // Create a container to hold the database info.
        const tableNameSpan = createSpan({
            "hx-get" : "./fragments/hxViewData.html",
            "hx-target" : "#mainContent",
            "hx-swap" : "innerHTML",
            "hx-trigger" : "click",
            "hx-on::before-request" : `selectedDatabase="${databaseAlias}"`,
            "hx-push-url" : `index.html?databaseRecordKey=${databaseRecordKey}&tableRecordKey=${table.id}`},
            ["pointer"]);
        tableNameSpan.textContent = table.tableAlias;

        // Table Icon
        const tableIcon = createIcon({},["m-1","bx","bx-table"]);

        // Icon for deleting a table.
        const trashIcon = createIcon({
            "data-action" : "deleteTable",
            "data-databaserecordkey" : databaseRecordKey,
            "data-tablerecordkey" : table.id},
            ["m-1","float-end","pointer","bx","bx-trash"]);

        // Icon for editing.
        const pencilIcon = createIcon({
            "data-database" : databaseAlias,
            "data-databaserecordkey" : databaseRecordKey,
            "data-togglemodal":"true",
            "data-target" : "universalModal",        
            "data-title" : "RENAME TABLE",
            "data-buttonaction" : "renameTable",
            "data-caption" : "RENAME",
            "hx-target" : "#modalContent", 
            "hx-trigger" : "click",
            "hx-get" : `fragments/hxProfile.html?databaseRecordKey=${databaseRecordKey}&tableRecordKey=${table.id}`,
            "hx-swap" : "innerHTML",
            "hx-push-url":`index.html?databaseRecordKey=${databaseRecordKey}&tableRecordKey=${table.id}`},
            ["m-1","float-end","pointer","bx","bx-edit"]);

        // Put the list item together.
        tableListItem.prepend(tableIcon);
        tableListItem.append(tableNameSpan);
        tableListItem.append(trashIcon);
        tableListItem.append(pencilIcon);
        
        tablesList.append(tableListItem);

        // Make sure HTMX works with the new items.
        processHTMX(pencilIcon, tableListItem);
    });
}


// Handle the page hxFields.html, which is loaded by HTMX.
async function handleFields() {

    logFunctionStart("handleFields");
    
    // Get params from the URL.
    const params = getParams();
    const tableRecordKey = params.tableRecordKey;
 
    // Get all fields for the table.
    const fieldRegistry = await dexieDatabaseRegistry
        .fieldRegistry
        .where("tableRecordKey")
        .equals(tableRecordKey)
        .toArray();

    const tableRecord = await dexieDatabaseRegistry.tableRegistry.get(tableRecordKey);
    const tableAlias = tableRecord.tableAlias;

    document.getElementById("holdTableAlias").textContent = tableAlias;
    const fieldsList = document.getElementById("fieldsList");
    
    if (fieldRegistry.length === 0 ) {
        
        const warning = createWarning("NO FIELDS DEFINED YET!")
        fieldsList.append (warning);

        return
    }

    // Loop over fields and display them.
    fieldRegistry.forEach( function (field) {
        
        // List item to hold table information.
        const spanListItem = document.createElement("li");

        // Create a container to hold the database info.
        const fieldNameSpan = createSpan({
            "hx-get" : "./fragments/hxFields.html",
            "hx-target" : "#mainContent",
            "hx-swap" : "innerHTML",
            "hx-trigger" : "click",
            "hx-push-url" : `index.html?tableRecordKey=${tableRecordKey}&fieldRecordKey=${field.id}`},
            ["pointer"]);
        fieldNameSpan.textContent = field.fieldAlias;

        // Field icon.
        const fieldIcon = createIcon({},["m-1","bx","bx-bracket"]);

        // Icon for deleting a field.
        const trashIcon = createIcon({
            "data-action" : "deleteField",
            "data-fieldRecordKey" : field.id,
            "data-tableRecordKey" : tableRecordKey},
            ["m-1","float-end","pointer","bx","bx-trash"]);

        // Icon for editing.
        const pencilIcon = createIcon({
            "data-fieldRecordKey" : field.id,
            "data-togglemodal":"true",
            "data-target" : "universalModal",        
            "data-title" : "RENAME FIELD",
            "data-buttonaction" : "renameField",
            "data-caption" : "RENAME",
            "hx-target" : "#modalContent", 
            "hx-trigger" : "click",
            "hx-get" : `fragments/hxProfile.html?tableRecordKey=${tableRecordKey}&fieldRecordKey=${field.id}`,
            "hx-swap" : "innerHTML",
            "hx-push-url":`index.html?tableRecordKey=${tableRecordKey}&fieldRecordKey=${field.id}`},
            ["m-1","float-end","pointer","bx","bx-edit"]);
        
        // Put the list item together.
        spanListItem.prepend(fieldIcon);
        spanListItem.append(fieldNameSpan);
        spanListItem.append(trashIcon);
        spanListItem.append(pencilIcon);

        fieldsList.append(spanListItem);

        // Make sure HTMX works with the new items.
        processHTMX(pencilIcon, spanListItem);
    })
}


// Handle the page hxViewData.html, which is loaded by HTMX.
async function handleViewData() {

    logFunctionStart("handleViewData");

    // Get params from the URL.
    const params = getParams();
    const databaseRecordKey = params.databaseRecordKey;
    const tableRecordKey = params.tableRecordKey;
    
    // Get all fields for the table.  This is returned as an array.
    const fieldRegistry = await dexieDatabaseRegistry.fieldRegistry
        .where("tableRecordKey")
        .equals(tableRecordKey)
        .sortBy('fieldName');
    const tableRecord = await dexieDatabaseRegistry.tableRegistry.get(tableRecordKey);
    const databaseRecord = await dexieDatabaseRegistry.databaseRegistry.get(tableRecord.databaseRecordKey);
    const version = Number(tableRecord.schemaVersion || 1);

    // Make sure to get a new record.
    document.getElementById("holdTableAlias").textContent = tableRecord.tableAlias;
    const newRecordButton = document.getElementById("newRecordButton");
    if (newRecordButton !== null) {
        newRecordButton.setAttribute("hx-push-url",`index.html?databaseRecordKey=${databaseRecordKey}&tableRecordKey=${tableRecordKey}`);
    }

    consoleCustomLog (
        "\nMetadata ",
        "\n========",
        "\ndatabase:  ",databaseRecord.databaseName,
        "\ndatabasealias:",databaseRecord.databaseAlias,
        "\ntable:  ",tableRecord.tableName,
        "\ntablealias:  ",tableRecord.tableAlias,
        "\nversion:  ",version,
        "\nfieldRegistry:  ", fieldRegistry,
        "\nfieldRegistryCount: ",fieldRegistry.length
    );

    let data = [];
    if (fieldRegistry.length !== 0) {
        
        let fieldNames = fieldRegistry.map(f => f.fieldName);
        fieldNames.unshift("++id");
        const fieldListString = fieldNames.join(','); 

        let workingDB = new Dexie(databaseRecord.databaseName);

        workingDB.version(version).stores({
            [tableRecord.tableName]: fieldListString
        });

        await workingDB.open();

        data = await workingDB.table(tableRecord.tableName).toArray();

        workingDB.close();
    }

    //Generate the table and add it to the DOM
    const viewDataContainer = document.getElementById('viewDataContainer');

    //Display the data.
    viewDataContainer.innerHTML = await createTableFromJSON(data,databaseRecordKey,tableRecordKey)

    // Make sure HTMX works with the new items.
    processHTMX("#viewDataContainer");
}


// Handle the page hxRecord.html, which is loaded by HTMX.
async function handleRecord() {

    logFunctionStart("handleRecord");

    // Get params from the URL.
    const params = getParams();
    const tableRecordKey = params.tableRecordKey;

    // Get the data for the table and database being used.
    const tableRecord = await dexieDatabaseRegistry.tableRegistry.get(tableRecordKey);
    const databaseRecord = await dexieDatabaseRegistry.databaseRegistry.get(tableRecord.databaseRecordKey);
    
    // Get all fields for the table.
    let fieldRegistry = await dexieDatabaseRegistry
        .fieldRegistry
        .where("tableRecordKey")
        .equals(tableRecordKey)
        .sortBy('fieldAlias');
    let fieldList = fieldRegistry.map(({ fieldName }) => fieldName);
    if (params.id) {
        fieldList.unshift("id");
    }
    let fieldListString = fieldList.join(','); 

    // Open the database.
    let workingDB = new Dexie(databaseRecord.databaseName);
    
    workingDB.version(Number(tableRecord.schemaVersion)).stores({
        [tableRecord.tableName]: fieldListString
    });
    await workingDB.open();

    // If the id parameter exists, then this is an update.  Get the data to populate the form.
    let dataRecord = [];
    if (params.id) {
        
        // Get the data that will be updated.
        dataRecord = await workingDB[tableRecord.tableName].where("id").equals(Number(params.id)).toArray();
        consoleCustomLog (
            "\ntableRecord.tableName:  ",tableRecord.tableName,
            "\nid:  ", params.id,
            "\ndataRecord:  ",dataRecord);

        // Prepend the id field.
        fieldRegistry.unshift({"fieldName":"id","fieldAlias":"id"})
    }

    // Build a form to hold the data.
    const formContainer = document.getElementById("formContainer");

    // Loop over the field data and build a form element for each item.
    fieldRegistry.forEach( function (field) {

        const element = document.createElement("div");
        element.classList.add("p-1");

        element.innerHTML = `
            <label for="${field.fieldName}" class="control-label">${field.fieldAlias}</label>
            <div>
                <input type="text" 
                    name="${field.fieldName}" 
                    id="${field.fieldName}"
                    value="${dataRecord[0]?.[field.fieldName] ?? '' }"
                    class="form-control" 
                    ${field.fieldName == 'id' ? "readonly" : ''}
                    autocomplete="off">
            </div>`;

            formContainer.append(element);
    })

    workingDB.close();
}

// Initialize the handler HTMX fragment handler.
export function initHTMXHandler () {

    document.body.addEventListener('htmx:afterSwap', async (e) => {

        // Get params from the URL.
        const params = getParams();
        const databaseRecordKey = params.databaseRecordKey;
        const tableRecordKey = params.tableRecordKey;

         // Get the fragment.
        let fragment = e.detail.pathInfo.requestPath.split("/").at(-1);
        fragment = fragment.split("?").at(0);       
        

        // Don't use the router for OOB swaps. 
        if (e.detail.elt.getAttribute("hx-swap-oob") === "true") {
            
            // Handle the breadcrumb urls.
            const databasesBreadCrumb = document.getElementById("databasesBreadCrumb");
            if (databasesBreadCrumb) {
                databasesBreadCrumb.setAttribute("hx-push-url",`index.html`);
            }

            const tablesBreadCrumb = document.getElementById("tablesBreadCrumb");
            if (tablesBreadCrumb) {
                tablesBreadCrumb.setAttribute("hx-push-url",`index.html?databaseRecordKey=${databaseRecordKey}`);
            }
            
            return
        }

        // Run Javascript for fragments.
        consoleCustomLog("\n\n**********\nThe fragment ", fragment.trim() ," is about to be processed by the HTMXHandler.");

        const fragmentMap = {
            'hxDatabases.html': handleDatabases,
            'hxProfile.html': handleProfile,
            'hxTables.html': handleTables,
            'hxFields.html' : handleFields,
            'hxViewData.html' : handleViewData,
            'hxRecord.html' : handleRecord
        };

        const handler = fragmentMap[fragment];
        if (handler) await handler();

    })
};