window.addEventListener('load', main);

function main() {
    vendorCount();
    buttonEvents();
    start = performance.now();
    vendorList();
    end = performance.now();
    timeTaken = end - start;
    console.log("Function took " + timeTaken + " milliseconds");
}

async function vendorCount() {
    const response = await fetch("/countVendors");
    if (response.ok){
        let vendorCount = await response.json();
        let vCount = document.querySelector('#vendorCount');
        vCount.textContent = vendorCount;
    }
}

async function addVendor() {
    const payload = { id : 1234, name : 'testVendor1234'}
    const response = await fetch('/addVendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (response.ok) {
        console.log('Vendor added successfully');
        vendorCount();
    }
}

async function vendorList(){
    const response = await fetch('/vendorList');
    if (response.ok){
        let vendorList = await response.json();
        for (const vendor of vendorList){
            const template = document.querySelector('#vendorInfo-template');
            const listItem = template.content.cloneNode(true);

            const name = listItem.querySelector('.vendorName');
            name.textContent = vendor.vendor_name;

            const linkedData = listItem.querySelector('.linkedData');
            linkedData.textContent = vendor.linked_data;

            const vendorList = document.querySelector('#vendorList');
            vendorList.append(listItem);
        }
    }   
}

async function removeVendor(){
    const payload = { name : 'testVendor134565'}
    const response = await fetch('/removeVendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (response.ok) {
        console.log('Vendor removed successfully');
        vendorCount();
    }
}

function buttonEvents(){
    let add = document.querySelector('#add');
    let rmv = document.querySelector('#rmv');

    add.addEventListener('click', addVendor);
    rmv.addEventListener('click', removeVendor);
}