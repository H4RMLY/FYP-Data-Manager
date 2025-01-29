window.addEventListener('load', main);

function main() {
    displayVendors();
    buttonEvents();
}

async function displayVendors() {
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
        displayVendors();
    }}

async function removeVendor(){
    const payload = { name : 'testVendor1234'}
    const response = await fetch('/removeVendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (response.ok) {
        console.log('Vendor removed successfully');
        displayVendors();
    }
}

function buttonEvents(){
    let add = document.querySelector('#add');
    let rmv = document.querySelector('#rmv');

    add.addEventListener('click', addVendor);
    rmv.addEventListener('click', removeVendor);
}