window.addEventListener('load', main);
const tabs = {};

async function main() {
    setTabs();
    vendorCount();
    pendingDataCount()
    
    const startTime = performance.now()

    vendorList();   // <---- measured code goes between startTime and endTime
    
    const endTime = performance.now()
    console.log(`Call to vendorList took ${endTime - startTime} milliseconds`)
    
    listPendingData();
    userDataList();
    //getAwaitingConfirmationCount();
    buttonEvents();

}

function setTabs(){
    tabs.vendorList = document.querySelector('#vendorList-container');
    tabs.pendingData = document.querySelector('#pendingDataTab');
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

async function getAwaitingConfirmationCount(){
    const response = await fetch("/awaitingCount");
    if (response.ok){
        let awaitingConfirmationCount = await response.json();
        let acCount = document.querySelector('#awaitingCount');
        acCount.textContent = awaitingConfirmationCount;
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
            let vendorDataTypes;
            if (response.ok){
                vendorDataTypes = await response.json();
                let linkedData = listItem.querySelector('.linkedDataText');
                linkedData.textContent = vendorDataTypes.join(', ');
            }

            const vendorList = document.querySelector('#vendorList');

            const deleteButton = listItem.querySelector('.deleteButton');
            deleteButton.dataset.id = vendor.vendor_id;
            deleteButton.addEventListener('click', deleteVendor);
            if(vendorDataTypes.length > 0){
                vendorList.append(listItem);
            }
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
            vendors.textContent = data.vendor_names;

            const userData = listItem.querySelector('.userData');
            userData.value = data.data;

            const dataType = listItem.querySelector('.userDataType');
            dataType.textContent = data.data_type;

            const deleteButton = listItem.querySelector('.deleteButton');
            deleteButton.dataset.id = data.data_id;
            deleteButton.addEventListener('click', deleteDataEvent);

            const editButton = listItem.querySelector('.editButton');
            editButton.dataset.id = data.data_id;
            editButton.addEventListener('click', editDataEvent);

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

// Refreshes user data list
function refreshUserDataList(){
    const list = document.querySelector('#userDataList');
    list.innerHTML = '';
    userDataList();
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
    const response = await fetch('/deleteData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (response.ok) {
        pendingDataCount();
        refreshPendingList();
    }
}

function deleteDataEvent(e){
    const dataId = e.target.dataset.id;
    informVendor(dataId, "DELETE");
}

function editDataEvent(e){
    const dataId = e.target.dataset.id;
    const dataField = e.target.parentNode.querySelector(".userData");
    let oldData = dataField.value;
    dataField.disabled = false;
    dataField.focus();
    dataField.addEventListener('keypress', function submit(e){
        if (e.key === 'Enter') {
            const newData = dataField.value;
            dataField.disabled = true;
            if (newData == oldData){
                console.log("No changes made.");
                dataField.removeEventListener('keypress', submit);
            } else {
                informVendor(dataId, "EDIT", newData);
                dataField.removeEventListener('keypress', submit);
                //getAwaitingConfirmationCount();
            }
        }
    });
}  

async function informVendor(dataId, decision, newData="") {
    const payload = { dataId : dataId, decision: decision };
    if (newData != ""){
        payload.newData = newData;
    }
    const response = await fetch('/informVendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (response.ok) {
        //getAwaitingConfirmationCount();
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
        vendorCount();
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
        userDataTab.classList.toggle('selected');
        vendorTab.classList.toggle('selected');
    }); 

    let userDataTab = document.querySelector('#userDataButton');
    userDataTab.addEventListener('click', () => {
        hideAllTabs();
        tabs.userData.classList.toggle('hidden');
        vendorTab.classList.toggle('selected');
        userDataTab.classList.toggle('selected');
        refreshUserDataList();
    });
}