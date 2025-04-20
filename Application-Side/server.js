import express from 'express';
import mysql from 'mysql';

// Set up server
const app = express();
const webRoot = './';
app.use(express.static(webRoot));
app.listen(8080);

// Database Initialisation
// CREATE TABLE vendor_info (vendor_id INT UNIQUE NOT NULL, vendor_name VARCHAR(64) NOT NULL, vendor_url VARCHAR(255) NOT NULL);
// CREATE TABLE data_links (vendor_id INT NOT NULL, data_id INT NOT NULL);
// CREATE TABLE data_buffer (data_id INT UNIQUE NOT NULL, data_type VARCHAR(32) NOT NULL, data VARCHAR(255));
// CREATE TABLE user_data (data_id INT UNIQUE NOT NULL, data_type VARCHAR(32) NOT NULL, data VARCHAR(255));

// Middleware for CORS requests. Allows any origin to make requests to the server.
const corsMiddleware = async function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, PATCH, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization');

    next();
}

app.use(corsMiddleware);

async function connectSQL(){
    const con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "8592",
        database: "pdm"
      });
    con.connect(function(err) {
        if (err) throw err;
    });
    return con;
}

const con = await connectSQL();

// Sends a count of all vendors in the database to the webpage.
async function countVendors(req, res){
    con.query("SELECT COUNT(DISTINCT vendor_info.vendor_id) as count FROM vendor_info, data_links WHERE vendor_info.vendor_id = data_links.vendor_id;", (err, result) =>
        {
            if (err) throw err;
            res.json(result[0].count);
        });
}

// Adds a new vendor to the database.
async function addVendor(vendorURL, vendorName){
    const vendorId = await generateID();
    con.query('INSERT INTO vendor_info VALUES (?,?,?)', [vendorId, vendorName, vendorURL], (err) => {
            if (err) throw err;
        });
}

// Removes a specified vendor from the database and its links.
async function removeVendor(req, res) {
    const id = req.body.id;
    // Delete vendor
    con.query("DELETE FROM vendor_info WHERE vendor_id = ?;", [id], (err, result) => {
        if (err) throw err;
    });
    // Delete links
    con.query("DELETE FROM data_links WHERE vendor_id = ?;", [id], (err, result) => {
        if (err) throw err;
    });
    res.json("Vendor deleted");
};

// Returns a list of all vendors in the vendor_info database.
async function getVendorList(req, res){
    con.query("SELECT * FROM vendor_info", async (err, result) => {
        if (err) throw err;
        res.json(result);
    });
}


// Adds the given data to the buffer table so that it can be verified by the user later.
async function addDataToBuffer(datatype, data, vendorName, purpose, dataId = 0){ 
    if (dataId === 0){
        dataId = await generateID();
    }
    con.query("INSERT INTO data_buffer VALUES (?, ?, ?, ?, ?);", [dataId, datatype, data, vendorName, purpose], (err, result) =>{
        if (err) throw err;
    });
    if (!purpose.includes('awaiting')){
        checkData(dataId, data, vendorName);
    }
    return dataId;
}


// Checks if the data in the buffer table already exists in user data. If so it creates a link with the existing data id and discards the buffer.
async function checkData(dataId, data, vendorName){
    con.query("SELECT * FROM user_data WHERE data = ?", [data], (err, result) =>
        {
            if (err) throw err;
            if(result.length > 0){
                console.log(`Data already exists in user data, creating link to data for vendor ${vendorName}`);
                linkData(vendorName, result[0].data_id);
                deleteDataFromBuffer(dataId);
            } else {
                console.log(`Data does not exist in user data, adding to buffer for varifiaction.`);
            }
        });
}

async function deleteLinks(dataId){
    con.query("DELETE FROM data_links WHERE data_id =?", [dataId], (err, result) =>
        {
            if (err) throw err;
        });
}

// Deletes a specified data from the buffer table.
async function deleteDataFromBuffer(dataID){
    con.query("DELETE FROM data_buffer WHERE data_id = ?", [dataID], (err, result) =>
        {
            if (err) throw err;
        });
}

// Moves the data from the buffer table to the user data table once it has been verified.
async function moveVerifiedData(req, res){
    const dataID = req.body.id; 
    const con = await connectSQL()
    // get data info from id in buffer table
    con.query('SELECT * FROM data_buffer WHERE data_id = ?', [dataID], (err, result) => {
        if (err) throw err; 
        if(result.length > 0){
            const data = result[0].data;
            const type = result[0].data_type;
            const vendorName = result[0].vendor_name;
            // insert data into user data table
            con.query("INSERT INTO user_data VALUES (?, ?, ?);", [dataID, type, data], (err, result) =>
                {
                    if (err) throw err;
                    console.log(`Data ID ${dataID} moved to user data.`);
                });
            res.json("Data varified");
            // create link to vendor and delete from buffer
            linkData(vendorName, dataID);
            deleteDataFromBuffer(dataID);
            mergeData(data);
        } else {
            console.log(`Data ID ${dataID} not found in buffer.`);
        }
    });
}

// Main recv async function that receives the user submitted data, datatype, vendor name and vendor ID
async function recvInfo(req, res){
    const vendorName = req.body.name;
    const type = req.body.datatype;
    const data = req.body.data;
    const vendorURL = `${req.hostname}:${req.body.port}`
    
    console.log(`Received data from ${vendorURL} for ${vendorName}: ${data}, type: ${type}`);

    // Check if the vendor already exists in the database.
    con.query('SELECT vendor_name FROM vendor_info WHERE vendor_name = ?', [vendorName], async (err, result) => {
    if(await result.length > 0){
        // If vendor exists, only add data to buffer
        addDataToBuffer(type, data, vendorName, "pending verification");
        res.json(`Data updated for ${vendorName}`);
    } else {
        // If vendor does not exist, create new vendor and add data to buffer
        addVendor(vendorURL, vendorName);
        addDataToBuffer(type, data, vendorName, "pending verification");
        res.json("Data received and stored");
    }
    });
}

// Generates a unique 8 digit ID.
async function generateID(){
    let length = 8;
    let result = '';
    const characters =
        '0123456789'; // Characters to pick from can be added to to include letters and symbols
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// Creates a link instance between a vendor and a data entry inside the data_links table.
async function linkData(vendorName, dataId){  
    con.query('SELECT vendor_id FROM vendor_info WHERE vendor_name = ?', [vendorName], (err, result) => {
        if (err) throw err;
        if (!result.length > 0){
            linkData(vendorName, dataId); // retries if vendor is still being added.
        } else {
            const vendorId = result[0].vendor_id;
            con.query('INSERT INTO data_links (vendor_id, data_id) SELECT ?, ? WHERE NOT EXISTS (SELECT * FROM data_links WHERE vendor_id = ? AND data_id = ?);', [vendorId, dataId, vendorId, dataId], (err, result) => {
                if (err) throw err;
            });
        }
    });
 }

// Retrieves a count of all pending data in the buffer table. 
async function getPendingDataCount(req, res){
    con.query("SELECT COUNT(*) as count FROM data_buffer WHERE purpose = 'pending verification';", (err, result) => {
            if (err) throw err;
            res.json(result[0].count);
    });
}

// Retrieves all instances in the buffer table.
async function getPendingData(req, res){
    con.query("SELECT * FROM data_buffer WHERE purpose = 'pending verification';", (err, result) => {
            if (err) throw err;
            res.json(result);
    });
}

// Deletes a specified data from the buffer table.
async function deleteData(dataId){
    con.query("DELETE FROM user_data WHERE data_id = ?", [dataId], (err, result) => {
            if (err) throw err;
            deleteLinks(dataId);
    });
    deleteDataFromBuffer(dataId);
}

// Gets data types for a specific vendor to be displayed on the vendor list.
async function getVendorDataTypes(req, res){
    const vendorId = req.body.vendor_id;
    con.query('SELECT vendor_id, data_type FROM data_links, user_data WHERE user_data.data_id = data_links.data_id AND vendor_id = ?;', [vendorId], (err, result) => {
        if (err) throw err;
        let dataTypes = [];
        for (const DT of result){
            //if (!dataTypes.includes(DT.data_type))
            dataTypes.push(DT.data_type); 
        } 
        res.json(dataTypes);
    });
}

// Gets all linked vendor names for the given data id and returns a list
async function getLinkedVendorName(data_id, callback){
    con.query('SELECT vendor_name, vendor_info.vendor_id FROM data_links, vendor_info WHERE data_links.vendor_id = vendor_info.vendor_id AND data_links.data_id =?;', [data_id], (err, result) => {
        if (err) throw err;
        let vendors = [];
        for (const vendor of result){
            vendors.push(vendor.vendor_name);
        }
        return callback(vendors);
    });
}

// Gets all user data then checks each data for vendors that are linked to it.
async function getUserDataList(req, res){
    let userData;
    // Gets all user data
    con.query("SELECT * FROM user_data", async (err, result) => {
        if (err) throw err;
        userData = result;
        // Checks each data for vendors that are linked to it.
        for (const data of result){
            let result = new Promise((resolve, reject) => {
                getLinkedVendorName(data.data_id, resolve);
            });
            userData[userData.indexOf(data)].vendor_names = await result;
        }
        res.json(userData); 
    });
}

// Edits the data with the given id 
async function editData(dataId, newData){
    con.query('UPDATE user_data SET data = ? WHERE data_id = ?;', [newData, dataId], (err, result) => {
        if (err) throw err;
        console.log(`Data ID ${dataId} updated to ${newData}`);
    });
    mergeData(newData);
    deleteDataFromBuffer(dataId);
}

async function addDataToUserData(data_id, data_type, data){
    con.query('INSERT INTO user_data VALUES (?, ?, ?);', [data_id, data_type, data], (err, result) => {
        if (err) throw err;
    });
}

// Merges the linked vendors of two of the same data instance into one and leaves only one instance of that data
async function mergeData(data){
    con.query('SELECT COUNT(*) as count FROM user_data WHERE data = ?;', [data], (err, result) => {
        if (err) throw err;
        console.log(result[0].count);
        if (result[0].count > 1){
            con.query('SELECT data_id, data_type FROM user_data WHERE data = ?;', [data], async (err, result) => {
                if (err) throw err;
                let vendors = [];
                for (const data of result){
                    let linkedVendors = await new Promise(async (resolve) => {
                       getLinkedVendorName(data.data_id, resolve);
                    });
                    for (const vendor of await linkedVendors){
                        vendors.push(vendor)
                    }
                    deleteData(data.data_id);
                };
                addDataToUserData(result[0].data_id, result[0].data_type, data);
                for (const vendor of vendors){
                    console.log(`Linking vendor ${vendor} to data ID ${result[0].data_id}`);
                    linkData(vendor, result[0].data_id);
                }
            });
        }
    });
}

async function informVendor(req, res){
    let sourceIp = req.connection.localAddress;
    const sourceURL = `${sourceIp.replace(/[:f]/g, '')}:${req.connection.localPort}`;
    con.query("SELECT vendor_url, vendor_name, data, data_type, user_data.data_id FROM vendor_info, user_data, data_links WHERE vendor_info.vendor_id = data_links.vendor_id AND user_data.data_id = data_links.data_id AND data_links.data_id = ?;", [req.body.dataId], async (err, result) => {
        if (err) throw err;
        for (const vendor of result){
            const vendorURL = vendor.vendor_url;
            const payload = {
                vendor_name: vendor.vendor_name,
                sourceURL: sourceURL,
                data_id: vendor.data_id,
                data: vendor.data,
                decision: req.body.decision
            };
            if (req.body.decision === "EDIT"){
                payload.newData = req.body.newData;
                addDataToBuffer(vendor.data_type, payload.newData, payload.vendor_name, 'awaiting edit', payload.data_id);
            } else {
                console.log(`adding ${vendor.data_id} to buffer for delete`);
                addDataToBuffer(vendor.data_type, payload.data, payload.vendor_name, 'awaiting delete', payload.data_id);
            }
            console.log(`Sending payload: ${JSON.stringify(payload)} to vendor @ ${vendorURL}`);
            const response = await fetch(`http://${vendorURL}/decisionRecv`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                let msg = await response.json();
                console.log(`Message from vendor: "${msg}"`);
            } if (response.error){
                console.error(`Error sending payload to vendor: ${response.error}`);
            }
        }
        res.json("Vendor Informed");
    });
}

async function enactLocalDecision(req, res){
    let content = req.params.decision;
    content = content.split('.');
    const decision = content[0];
    const dataId = content[1];
    console.log(`Confirmation of ${decision} received`);
    if (decision === "EDIT"){
        console.log(`updating data for ${dataId}`);
        con.query("SELECT data FROM data_buffer WHERE data_id = ? AND purpose = 'awaiting edit';", [dataId], (err, result) => {
            if (err) throw err;
            editData(dataId, result[0].data);
        });
    } else if (decision === "DELETE"){
        console.log(`Deleting data for ${dataId}`);
        deleteData(dataId);
    }
    res.status(200).send("Decision processed");
}

async function getAwaitingDataInfo(req, res){
    let data = [{count: 0}];
    data[1] = await new Promise((resolve, reject) => {
        getAwaitingData(resolve);
    });
    data[0].count = data[1].length; 
    res.json(data);
} 

function getAwaitingData(callback){
    con.query("SELECT * FROM data_buffer WHERE purpose LIKE '%awaiting%';", (err, result) =>
        {
            if (err) throw err;
            callback(result);
        });
}

// Routes
app.get('/pendingData', getPendingData);
app.get('/verifyDataCount', getPendingDataCount);
app.get('/countVendors', countVendors);
app.get('/vendorList', getVendorList);
app.get('/getUserDataList', getUserDataList);
app.get('/decisionResponse/:decision', enactLocalDecision);
app.get('/awaitingData', getAwaitingDataInfo);
app.post('/getVendorDataTypes', express.json(), getVendorDataTypes);
app.post('/sendUserInfo', express.json(), recvInfo);
app.post('/removeVendor', express.json(), removeVendor);
app.post('/deleteData', express.json(), deleteData);
app.post('/verifyData', express.json(), moveVerifiedData);
app.post('/deleteVendor', express.json(), removeVendor);
app.post('/editData', express.json(), editData);
app.post('/informVendor', express.json(), informVendor);

