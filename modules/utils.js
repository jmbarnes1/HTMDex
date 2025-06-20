//Used by code see if locally stored variable is a JSON object.
export function isJsonString(str) {
    try 
    {
        JSON.parse(str);
    } 
    catch (e) 
    {
        return false;
    }

    return true;
}


//Simple confirm.  Used with deletes normally.
export function userConfirm(message = 'Are you sure?') {
    return confirm(message);
}


//Set focus.  Used in modals.
export function focusAndSelectElement(elementId, delay = 250) {
    setTimeout
    (
        () => 
        {
            const element = document.getElementById(elementId);
            if (element) 
            {
                element.focus();
                element.select();
            } 
            else 
            {
                console.warn(`Element with ID "${elementId}" not found.`);
            }
        }, 
        delay
    );
}

//HTMX will not be able to process URL parameters unless it's on a traditional server.
//This can be used as a replacement.
export function getReferrerParams() {
    try {
        const referrerURL = new URL(document.referrer);
        return Object.fromEntries(referrerURL.searchParams.entries());
    } catch (e) {
        console.warn("Unable to parse document.referrer:", e);
        return {};
    }
}


// export function customConsole(toggleConsole, ...args ) {
//     if (toggleConsole === 1) {

        //Arguments are a psuedo Array.  Make it a real Array.
        //let a = [...arguments];
        //a.shift();
        
        //console.log(...a );
        //console.log(...args);
//     }
// }

export function createLogger(enabled = true) {
    return function log(...args) {
        if (enabled) console.log(...args);
    };
}