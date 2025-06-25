import { getParams } from "./utils.js";

async function handleDatabases() {

    consoleCustomLog("\n\n**********\nThe fragment hxDatabases.html has been loaded.");

    const databaseList = document.getElementById("databaseList");

    // Clean up.
    databaseList.innerHTML = "";
    
    //Loop over entries.
    dexieDatabaseRegistry.databaseRegistry.each ( databaseDocument => {

        // List item to hold database information.
        const databaseListItem = document.createElement("li");

        const databaseNameSpan = document.createElement("span");
        databaseNameSpan.setAttribute("hx-get", "./fragments/hxTables.html");
        databaseNameSpan.setAttribute("hx-target", "#mainContent");
        databaseNameSpan.setAttribute("hx-swap", "innerHTML");
        databaseNameSpan.setAttribute("hx-trigger", "click");
        databaseNameSpan.setAttribute("hx-push-url",`index.html?databaseRecordKey=${databaseDocument.id}`);
        databaseNameSpan.classList.add("pointer");
        databaseNameSpan.textContent = databaseDocument.databaseAlias;

        const dbIcon = document.createElement("i");
        dbIcon.classList.add("m-1","bx","bx-data");

        const trashIcon = document.createElement("i");
        trashIcon.classList.add("m-1","float-end","pointer","bx","bx-trash");
        trashIcon.setAttribute("data-action", "deleteDatabase");
        trashIcon.setAttribute("data-database", databaseDocument.databaseName);
        trashIcon.setAttribute("data-databaserecordkey", databaseDocument.id);

        const pencilIcon = document.createElement("i");
        pencilIcon.classList.add("m-1","float-end","pointer","bx","bx-edit");
        pencilIcon.setAttribute("data-database", databaseDocument.databaseName);
        pencilIcon.setAttribute("data-databaseRecordKey", databaseDocument.id);

        pencilIcon.setAttribute("data-target","universalModal");                       
        pencilIcon.setAttribute("data-title","RENAME DATABASE");
        pencilIcon.setAttribute("data-buttonaction","renameDatabase");
        pencilIcon.setAttribute("data-caption","RENAME");
        pencilIcon.setAttribute("hx-target","#modalContent"); 
        pencilIcon.setAttribute("hx-trigger","click"); 
        pencilIcon.setAttribute("hx-get",`fragments/hxProfile.html?database=${databaseDocument.databaseName}&databaseRecordKey=${databaseDocument.id}`); 
        pencilIcon.setAttribute("hx-swap","innerHTML");
        pencilIcon.setAttribute("hx-push-url",`index.html?database=${databaseDocument.databaseName}&databaseRecordKey=${databaseDocument.id}`);

        pencilIcon.setAttribute("onclick","toggleModal(event)");

        databaseListItem.prepend(dbIcon);

        databaseListItem.append(databaseNameSpan);
        databaseListItem.append(trashIcon);
        databaseListItem.append(pencilIcon);

        
        databaseList.append(databaseListItem);
        
        htmx.process(pencilIcon);
        htmx.process(databaseListItem);
    });
}

async function handleProfile() { 

    const profileInput = document.getElementById('profileInput');
    
    if (profileInput) {
        profileInput.focus();
        profileInput.select();
    }
}

async function handleTables() 
{

    consoleCustomLog("\n\n**********\nThe fragment hxTables.html has been loaded.");
    
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

    // Output the schema of each table.
    tableRegistry.forEach( function (table) {

        // List item to hold table information.
        const tableListItem = document.createElement("li");

        const tableNameSpan = document.createElement("span");
        //tableNameSpan.setAttribute("hx-get", "./fragments/hxFields.html");
        tableNameSpan.setAttribute("hx-get", "./fragments/hxViewData.html");
        tableNameSpan.setAttribute("hx-target", "#mainContent");
        tableNameSpan.setAttribute("hx-swap", "innerHTML");
        tableNameSpan.setAttribute("hx-trigger", "click");
        tableNameSpan.setAttribute("hx-on::before-request", `selectedDatabase="${databaseAlias}"`);
        tableNameSpan.setAttribute("hx-push-url",`index.html?databaseRecordKey=${databaseRecordKey}&tableRecordKey=${table.id}`);
        tableNameSpan.classList.add("pointer");
        tableNameSpan.textContent = table.tableAlias;

        const tableIcon = document.createElement("i");
        tableIcon.classList.add("m-1","bx","bx-table");

        const trashIcon = document.createElement("i");
        trashIcon.classList.add("m-1","float-end","pointer","bx","bx-trash");
        trashIcon.setAttribute("data-action", "deleteTable");
        trashIcon.setAttribute("data-databaserecordkey", databaseRecordKey);
        trashIcon.setAttribute("data-tablerecordkey", table.id);

        const pencilIcon = document.createElement("i");
        pencilIcon.classList.add("m-1","float-end","pointer","bx","bx-edit");
        pencilIcon.setAttribute("data-database", databaseAlias);
        pencilIcon.setAttribute("data-databaserecordkey", databaseRecordKey);
        pencilIcon.setAttribute("data-target","universalModal");                       
        pencilIcon.setAttribute("data-title","RENAME TABLE");
        pencilIcon.setAttribute("data-buttonaction","renameTable");
        pencilIcon.setAttribute("data-caption","RENAME");
        pencilIcon.setAttribute("hx-target","#modalContent"); 
        pencilIcon.setAttribute("hx-trigger","click"); 
        pencilIcon.setAttribute("hx-get",`fragments/hxProfile.html?databaseRecordKey=${databaseRecordKey}&tableRecordKey=${table.id}`); 
        pencilIcon.setAttribute("hx-swap","innerHTML");
        pencilIcon.setAttribute("hx-push-url",`index.html?databaseRecordKey=${databaseRecordKey}&tableRecordKey=${table.id}`);
        pencilIcon.setAttribute("onclick","toggleModal(event)");

        tableListItem.append(tableNameSpan);
        tableListItem.append(trashIcon);
        tableListItem.append(pencilIcon);
        
        const tablesList = document.getElementById("tablesList");
        tablesList.append(tableListItem);

        tableListItem.prepend(tableIcon);

        htmx.process(pencilIcon);
        htmx.process(tableListItem);

    });
}

async function handleFields() {

    consoleCustomLog("\n\n**********\nThe fragment hxFields.html has been loaded.");

    // Get params from the URL.
    const params = getParams();
    const databaseRecordKey = params.databaseRecordKey;
    const tableRecordKey = params.tableRecordKey;
 
    // Get all fields for the table.
    const fieldRegistry = await dexieDatabaseRegistry
        .fieldRegistry
        .where("tableRecordKey")
        .equals(tableRecordKey)
        .sortBy('fieldName');

    const tableRecord = await dexieDatabaseRegistry.tableRegistry.get(tableRecordKey);
    const tableAlias = tableRecord.tableAlias;

    document.getElementById("holdTableAlias").textContent = tableAlias;
    const fieldsList = document.getElementById("fieldsList");
    
    if (fieldRegistry.length === 0 ) {
        
        const warning = document.createElement("article");
        warning.classList.add("pico-background-red-300","text-center");
        warning.textContent = "NO FIELDS DEFINED YET!";
        fieldsList.append (
            warning
        );

        return
    }

    // Loop over fields and display them.
    fieldRegistry.forEach( function (field) {
        
        // List item to hold table information.
        const spanListItem = document.createElement("li");

        // Span to hold actual attributes for HTMX.
        const fieldNameSpan = document.createElement("span");
        fieldNameSpan.setAttribute("hx-get", "./fragments/hxFields.html");
        fieldNameSpan.setAttribute("hx-target", "#mainContent");
        fieldNameSpan.setAttribute("hx-swap", "innerHTML");
        fieldNameSpan.setAttribute("hx-trigger", "click");
        fieldNameSpan.setAttribute("hx-push-url",`index.html?tableRecordKey=${tableRecordKey}&fieldRecordKey=${field.id}`);
        fieldNameSpan.classList.add("pointer");
        fieldNameSpan.textContent = field.fieldAlias;

        const fieldIcon = document.createElement("i");
        fieldIcon.classList.add("m-1","bx","bx-bracket");

        // Icon for deleting a field.
        const trashIcon = document.createElement("i");
        trashIcon.classList.add("m-1","float-end","pointer","bx","bx-trash");
        trashIcon.setAttribute("data-action", "deleteField");
        trashIcon.setAttribute("data-fieldRecordKey", field.id);
        trashIcon.setAttribute("data-tableRecordKey", tableRecordKey);

        // Icon for editing.
        const pencilIcon = document.createElement("i");
        pencilIcon.classList.add("m-1","float-end","pointer","bx","bx-edit");
        pencilIcon.setAttribute("data-fieldRecordKey", field.id);
        pencilIcon.setAttribute("data-target","universalModal");                       
        pencilIcon.setAttribute("data-title","RENAME FIELD");
        pencilIcon.setAttribute("data-buttonaction","renameField");
        pencilIcon.setAttribute("data-caption","RENAME");
        pencilIcon.setAttribute("hx-target","#modalContent"); 
        pencilIcon.setAttribute("hx-trigger","click"); 
        pencilIcon.setAttribute("hx-get",`fragments/hxProfile.html?tableRecordKey=${tableRecordKey}&fieldRecordKey=${field.id}`); 
        pencilIcon.setAttribute("hx-swap","innerHTML");
        pencilIcon.setAttribute("hx-push-url",`index.html?tableRecordKey=${tableRecordKey}&fieldRecordKey=${field.id}`);
        pencilIcon.setAttribute("onclick","toggleModal(event)");

        spanListItem.append(fieldNameSpan);
        spanListItem.append(trashIcon);
        spanListItem.append(pencilIcon);

        const fieldsList = document.getElementById("fieldsList");
        fieldsList.append(spanListItem);

        spanListItem.prepend(fieldIcon);

        htmx.process(pencilIcon);
        htmx.process(spanListItem);

    })
}

async function handleViewData() {

    consoleCustomLog("\n\n**********\nThe fragment hxViewData.html has been loaded.\n");

    // Get params from the URL.
    const params = getParams();
    const databaseRecordKey = params.databaseRecordKey;
    const tableRecordKey = params.tableRecordKey;
    
    // Get all fields for the table.
    const fieldRegistry = await dexieDatabaseRegistry.fieldRegistry.where("tableRecordKey").equals(tableRecordKey).sortBy('fieldName');

    const tableRecord = await dexieDatabaseRegistry.tableRegistry.get(tableRecordKey);
    const databaseRecord = await dexieDatabaseRegistry.databaseRegistry.get(tableRecord.databaseRecordKey);

    document.getElementById("holdTableAlias").textContent = tableRecord.tableAlias;

    consoleCustomLog (
        "\nMetadata ",
        "\n========",
        "\ndatabase:  ",databaseRecord.databaseName,
        "\ndatabasealias:",databaseRecord.databaseAlias,
        "\ntable:  ",tableRecord.tableName,
        "\ntablealias:  ",tableRecord.tableAlias,
        "\nfieldRegistry:  ", fieldRegistry);
    
    const fieldNames = fieldRegistry.map(f => f.fieldName);
    const fieldListString = fieldNames.join(','); 

    const db = new Dexie(databaseRecord.databaseName);
    db.version(1).stores({
        [tableRecord.tableName]: fieldListString
    });

    await db.open();

    const data = await db.table(tableRecord.tableName).toArray();

    //Generate the table and add it to the DOM
    const viewDataContainer = document.getElementById('viewDataContainer');

    //Display the data.
    viewDataContainer.innerHTML = await createTableFromJSON(data,databaseRecordKey,tableRecordKey)

    htmx.process("#viewDataContainer");
}

async function handleRecord() {

    consoleCustomLog("\n\n**********\nThe fragment hxRecord.html has been loaded.");
    
    let searchParams = new URLSearchParams(window.location.search);
    
    // Get the keys for the table and database being used.
    const tableRecordKey = Number(searchParams.get('tableRecordKey'));
    const databaseRecordKey = Number(searchParams.get('databaseRecordKey'));
    
    // Get the data for the table and database being used.
    const tableRecord = await dexieDatabaseRegistry.tableRegistry.get(tableRecordKey);
    const databaseRecord = await dexieDatabaseRegistry.databaseRegistry.get(tableRecord.databaseRecordKey);
    
    // Get all fields for the table.
    let fieldRegistry = await dexieDatabaseRegistry.fieldRegistry.where("tableRecordKey").equals(tableRecordKey).sortBy('fieldAlias');
    let fieldList = fieldRegistry.map(({ fieldName }) => fieldName);
    let fieldListString = fieldList.join(','); 
    consoleCustomLog("fieldRegistry:  ",fieldRegistry);

    // Open the database.
    let db = new Dexie(databaseRecord.databaseName);
    db.version(1).stores({
        [tableRecord.tableName]: fieldListString
    });
    consoleCustomLog("db:  ",db);

    // If the id parameter exists, then this is an update.  Get the data to populate the form.
    let dataRecord = [];
    if (searchParams.get('id')) {
        
        // Get the data that will be updated.
        dataRecord = await db[tableRecord.tableName].where("id").equals(Number(searchParams.get('id'))).toArray();
        consoleCustomLog (
            "\ntableRecord.tableName:  ",
            tableRecord.tableName,
            "\nid:  ",
            searchParams.get('id'),
            "\ndataRecord:  ",
            dataRecord);

        // Prepend the id field.
        fieldRegistry.unshift({"fieldName":"id","fieldAlias":"id"})
    }

    // Build a form to hold the data.
    const formContainer = document.getElementById("formContainer");
    const modalButton = document.getElementById("recordForm");
    modalButton.setAttribute("form","modalButton");


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
}

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
                if (databaseRecordKey && databaseRecordKey != '') {
                    databasesBreadCrumb.setAttribute("hx-push-url",`index.html?databaseRecordKey=${databaseRecordKey}`);
                }
            }

            const tablesBreadCrumb = document.getElementById("tablesBreadCrumb");
            if (databasesBreadCrumb) {
                if ((tableRecordKey) && tableRecordKey != '') {
                    tablesBreadCrumb.setAttribute("hx-push-url",`index.html?databaseRecordKey=${databaseRecordKey}&tableRecordKey=${tableRecordKey}`);
                }
            }
            
            return
        }

        consoleCustomLog("\n\n**********\nThe fragment ", fragment.trim() ," is about to be processed by the HTMXHandler.");

        switch (fragment) {
            case 'hxDatabases.html' : 
                await handleDatabases();
                break;

            case 'hxProfile.html' :
                await handleProfile ();
                break;
            
            case 'hxTables.html' :
                await handleTables();
                break;

            case 'hxFields.html' :
                await handleFields();
                break;

            case 'hxViewData.html' :
                await handleViewData();
                break;

            case 'hxRecord.html' :
                await handleRecord();
                break;

        }
    })
};