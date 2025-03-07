window.addEventListener('load', main);


async function main() {
    vendorCount();
    pendingDataCount()
    vendorList();
    listPendingData();
    buttonEvents();
}

// Fetches the number of vendors in the database and displays it on the page.
async function vendorCount() {
    const response = await fetch("/countVendors");
    if (response.ok){
        let vendorCount = await response.json();
        let vCount = document.querySelector('#vendorCount');
        vCount.textContent = vendorCount;
    }
}

// Fetches the amount of data that needs to be varified and displays it next to the varify button.
async function pendingDataCount() {
    const response = await fetch("/verifyDataCount");
    if (response.ok){   
        let verifyDataCount = await response.json();
        let vCount = document.querySelector('#verifyCount');
        vCount.textContent = verifyDataCount;
    }
}

// Show pending data for varification.
function showPendingData() {
    const tab = document.querySelector('#pendingDataTab');
    tab.classList.toggle('hidden');
}

// Referesh the pending data list.
function refreshPendingList(){
    const list = document.querySelector('#pendingList');
    list.innerHTML = '';
    listPendingData();
}

// Creates list items for each pending data item.
async function listPendingData() {
    const template = document.querySelector('#pendingItem-template');
    template.classList.remove('hidden');
    const response = await fetch("/pendingData");
    if (response.ok){
        let pendingData = await response.json();
        let pendingList = document.querySelector('#pendingList');
        for (const data of pendingData){
            const listItem = template.content.cloneNode(true);
            const nameField = listItem.querySelector('.vendorName');
            const dataField = listItem.querySelector('.data');

            nameField.textContent = data.vendor_name;
            dataField.textContent = data.data;

            const rejectButton = listItem.querySelector('.rejectButton');
            rejectButton.dataset.id = data.id;
            rejectButton.addEventListener('click', rejectData);

            const verifyButton = listItem.querySelector('.verifyButton');
            verifyButton.dataset.id = data.id;
            verifyButton.addEventListener('click', verifyData);

            pendingList.append(listItem);
        }
    }
} 

// Fetches and displays all vendors from the database on the page.
async function vendorList(){
    const response = await fetch('/vendorList');
    if (response.ok){
        let vendorList = await response.json();
        for (const vendor of vendorList){
            const template = document.querySelector('#vendorInfo-template');
            const listItem = template.content.cloneNode(true);

            const name = listItem.querySelector('.vendorNameText');
            name.textContent = vendor.name;

            const linkedData = listItem.querySelector('.linkedDataText');
            let linkedDataContent = '';
            for (const datatype of vendor.linked_data){
                // Check if data type already exists in the list to avoid duplicates
                if (!linkedDataContent.includes(datatype)){
                    linkedDataContent += `${datatype}, `;
                }
            }
            linkedDataContent = linkedDataContent.slice(0, -2); // Remove trailing comma and space
            linkedData.textContent = linkedDataContent;

            const vendorList = document.querySelector('#vendorList');

            const deleteButton = listItem.querySelector('.deleteButton');
            deleteButton.dataset.id = vendor.id;
            deleteButton.addEventListener('click', deleteVendor);
            
            vendorList.append(listItem);
        }
    }   
}

// Deletes a vendor from the database.
async function deleteVendor(e){
    const payload = { id : e.target.dataset.id}
    const response = await fetch('/deleteVendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (response.ok) {
        refreshVendorList();
        vendorCount();
    }
}

// Refresh the vendor list.
function refreshVendorList(){
    const list = document.querySelector('#vendorList');
    list.innerHTML = '';
    vendorList();
}

// Deletes data items from the buffer
async function rejectData(e){
    const payload = { id : e.target.dataset.id}
    const response = await fetch('/rejectData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (response.ok) {
        pendingDataCount();
        refreshPendingList();
    }
}

// Varify data button event
async function verifyData(e){
    const payload = { id : e.target.dataset.id };
    const response = await fetch('/verifyData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (response.ok) {
        pendingDataCount();
        refreshPendingList();
        refreshVendorList();
    }
}

// Set button events
function buttonEvents(){
    let pendingTab = document.querySelector('#pendingDataButton');

    pendingTab.addEventListener('click', showPendingData);
}