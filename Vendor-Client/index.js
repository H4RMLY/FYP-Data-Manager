function main(){
    buttonEvents();
}

async function sendUserData(pdvID, payload){
    const response = await fetch(`${pdvID}/sendUserInfo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (response.ok) {
        let text = document.querySelector('#serverMsg');
        let content = await response.json();
        text.textContent = content;
    }}

async function createPayload(vendorName, datatype, data){
    const response = await fetch("/getPort");
    let port;
    if (response.ok){
        port = await response.json();
        console.log(port);
        let payload = { port: port, name: vendorName, datatype: datatype, data: data };
        return payload;
    }
}

function grabAddress(){
    let inputs = document.querySelectorAll('.addr-input');
    let addrLine1 = inputs[0].value;
    let addrLine2 = inputs[1].value;
    let city = inputs[2].value;
    let county = inputs[3].value;
    let postcode = inputs[4].value;

    return `${addrLine1}, ${addrLine2}, ${city}, ${county}, ${postcode}`;
}

function grabCard(){
    let inputs = document.querySelectorAll('.card-input');
    let cardNumber = inputs[0].value;
    let expiryDate = inputs[1].value;
    let cvv = inputs[2].value;
    return `${cardNumber}, ${expiryDate}, ${cvv}`;
}

async function buttonEvents(){
    let submitAddress = document.querySelector('#submit-address');
    let submitCard = document.querySelector('#submit-card');

    submitAddress.addEventListener('click', async (e) => {
        let pdvID = document.querySelector('#url').value;
        let vendorName = document.querySelector('#vendorName').value;
        let address = grabAddress();
        let datatype = e.target.dataset.type;

        let payload = await createPayload(vendorName, datatype, address);
        console.log(payload);

        sendUserData(pdvID, payload);
        }); 
    
    submitCard.addEventListener('click', async (e) => {
        let pdvID = document.querySelector('#url').value;
        let vendorName = document.querySelector('#vendorName').value;
        let cardInfo = grabCard();
        let datatype = e.target.dataset.type;

        let payload = await createPayload(vendorName, datatype, cardInfo);
        console.log(payload);
        sendUserData(pdvID, payload);
    });
}

main();