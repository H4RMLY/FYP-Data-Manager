window.addEventListener('load', main);
const tabs = {};

async function main() {
    setTabs();
    vendorCount();
    pendingDataCount()
    vendorList();
    listPendingData();
    userDataList();
    buttonEvents();
}

function setTabs(){
    tabs.vendorList = document.querySelector('#vendorList-container');
    tabs.pendingData = document.querySelector('#pendingList-container');
    tabs.userData = document.querySelector('#userData-container');
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
            rejectButton.dataset.id = data.data_id;
            rejectButton.addEventListener('click', rejectData);

            const verifyButton = listItem.querySelector('.verifyButton');
            verifyButton.dataset.id = data.data_id;
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
            name.textContent = vendor.vendor_name;

            const payload = { vendor_id: vendor.vendor_id };
            const response = await fetch('/getVendorDataTypes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.ok){
                let vendorDataTypes = await response.json();
                let linkedData = listItem.querySelector('.linkedDataText');
                linkedData.textContent = vendorDataTypes.join(', ');
            }

            const vendorList = document.querySelector('#vendorList');

            const deleteButton = listItem.querySelector('.deleteButton');
            deleteButton.dataset.id = vendor.vendor_id;
            deleteButton.addEventListener('click', deleteVendor);
            
            vendorList.append(listItem);
        }
    }   
}

// Fetches and displays all varified user data on the saved data list
async function userDataList(){
    const response = await fetch('/getUserDataList');
    if (response.ok){
        let userDataList = await response.json();
        for (const data of userDataList){
            const template = document.querySelector('#userData-template');
            const listItem = template.content.cloneNode(true);

            const vendors = listItem.querySelector('.userDataVendors');
            vendors.textContent = data.vendor_name;

            const userData = listItem.querySelector('.userData');
            userData.textContent = data.data;

            const dataType = listItem.querySelector('.userDataType');
            dataType.textContent = data.data_type;

            const userDataListElem = document.querySelector('#userDataList');
            
            userDataListElem.append(listItem);
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

function hideAllTabs(){
    tabs.userData.classList.add('hidden');
    tabs.pendingData.classList.add('hidden');
    tabs.vendorList.classList.add('hidden');
}

// Set button events
function buttonEvents(){
    let pendingTab = document.querySelector('#pendingDataButton');
    pendingTab.addEventListener('click', () => {
        tabs.pendingData.classList.toggle('hidden');
    });

    let vendorTab = document.querySelector('#vendorListButton');
    vendorTab.addEventListener('click', () => {
        hideAllTabs();
        tabs.vendorList.classList.toggle('hidden');
    }); 

    let userDataTab = document.querySelector('#userDataButton');
    userDataTab.addEventListener('click', () => {
        hideAllTabs();
        tabs.userData.classList.toggle('hidden');
    });
}