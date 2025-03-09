import express from 'express';
import mysql from 'mysql';

// Set up server
const app = express();
const webRoot = './';
app.use(express.static(webRoot));
app.listen(8080);
//initialiseDatabase();

// Database Initialisation
// New Commands
// CREATE TABLE vendor_info (vendor_id INT UNIQUE NOT NULL, vendor_name VARCHAR(64) NOT NULL);
// CREATE TABLE data_links (vendor_id INT NOT NULL, data_id INT NOT NULL);
// CREATE TABLE data_buffer (data_id INT UNIQUE NOT NULL, data_type VARCHAR(32) NOT NULL, data VARCHAR(255));
// CREATE TABLE user_data (data_id INT UNIQUE NOT NULL, data_type VARCHAR(32) NOT NULL, data VARCHAR(255));
// function initialiseDatabase(){
//     const con = connectSQL();  
//     con.query("CREATE TABLE IF NOT EXISTS user_data (id INT UNIQUE NOT NULL, type VARCHAR(32) NOT NULL, data VARCHAR(255));", (err, result) =>
//         {
//             if (err) throw err;
//             console.log(result.message);
//         });
//     con.query("CREATE TABLE IF NOT EXISTS vendor_info (vendor_id INT NOT NULL, vendor_name VARCHAR(64), linked_data VARCHAR(255));", (err, result) =>
//         {
//             if (err) throw err;
//             console.log(result.message);
//         });
//     con.query("CREATE TABLE IF NOT EXISTS data_buffer (id INT UNIQUE NOT NULL, type VARCHAR(32) NOT NULL, data VARCHAR(255));", (err, result) =>
//         {
//             if (err) throw err;
//             console.log(result.message);
//         });
//     con.query("ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '8592';", (err, result) =>{
//         if (err) throw err;
//         console.log(result.message);
//     });
//     con.end();
// }
// Server Functions

// Middleware for CORS requests. Allows any origin to make requests to the server.
const corsMiddleware = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, PATCH, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization');

    next();
}

app.use(corsMiddleware);
// Function to connect to the MySQL database.
function connectSQL(){
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

// Sends a count of all vendors in the database to the webpage.
function countVendors(req, res){
    const con = connectSQL();
    con.query("SELECT COUNT(*) as count FROM vendor_info;", (err, result) =>
        {
            if (err) throw err;
            res.json(result[0].count);
        });
    con.end();
}

// Adds a new vendor to the database.
function addVendor(name){
    const id = generateID();
    const con = connectSQL();
    con.query('INSERT INTO vendor_info VALUES (?,?)', [id, name], (err) =>
        {
            if (err) throw err;
        })
    con.end();
}

// Removes a specified vendor from the database.
function removeVendor(req, res) {
    const con = connectSQL();
    const id = req.body.id;
    con.query("DELETE FROM vendor_info WHERE vendor_id = ?;", [id], (err, result) =>
        {
            if (err) throw err;
        });
    con.query("DELETE FROM data_links WHERE vendor_id = ?;", [id], (err, result) =>
        {
            if (err) throw err;
    });
    con.end();
    res.json("Vendor deleted");
};

// Returns a list of all vendors in the database.
async function getVendorList(req, res){
    const con = connectSQL();
    con.query("SELECT * FROM vendor_info", async (err, result) => {
            if (err) throw err;
            res.json(result);
    });
    con.end();
}


// Adds the given data to the buffer table so that it can be verified by the user later.
function addDataToBuffer(datatype, data, vendorName){
    const id = generateID();
    const con = connectSQL();
    con.query("INSERT INTO data_buffer VALUES (?, ?, ?, ?);", [id, datatype, data, vendorName], (err, result) =>
        {
            if (err) throw err;
        })
    con.end();
    checkData(id, data, vendorName);
    return id;
}


// Checks if the data in the buffer table already exists in user data. If so it updates the vendor linked data with the existing data id and discards the buffer.
function checkData(dataId, data, vendorName){
    const con = connectSQL();
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
        })
    con.end();
}

// Deletes a specified data from the buffer table.
function deleteDataFromBuffer(dataID){
    const con = connectSQL();
    con.query("DELETE FROM data_buffer WHERE data_id = ?", [dataID], (err, result) =>
        {
            if (err) throw err;
        })
    con.end();
}

// Moves the data from the buffer table to the user data table once it has been verified.
function moveVerifiedData(req, res){
    const dataID = req.body.id; 
    const con = connectSQL()
    con.query('SELECT * FROM data_buffer WHERE data_id = ?', [dataID], (err, result) => {
        if (err) throw err; 
        if(result.length > 0){
            const data = result[0].data;
            const type = result[0].data_type;
            const vendorName = result[0].vendor_name;
            con.query("INSERT INTO user_data VALUES (?, ?, ?);", [dataID, type, data], (err, result) =>
                {
                    if (err) throw err;
                    console.log(`Data ID ${dataID} moved to user data.`);
                })
            res.json("Data varified");
            linkData(vendorName, dataID);
            deleteDataFromBuffer(dataID);

        } else {
            console.log(`Data ID ${dataID} not found in buffer.`);
        }
    })
}

// Main recv function that receive the user submitted data, datatype, vendor name and vendor ID
function recvInfo(req, res){
    const vendorName = req.body.name;
    const type = req.body.datatype;
    const data = req.body.data;

    console.log(`Received data for ${vendorName}: ${data}, type: ${type}`);

    // Check if the vendor already exists in the database.
    const con = connectSQL();
    con.query('SELECT vendor_name FROM vendor_info WHERE vendor_name = ?', [vendorName], (err, result) => {
    if(result.length > 0){
        // If vendor exists, add the data ID to the vendor's record.
        addDataToBuffer(type, data, vendorName);
        res.json(`Data updated for ${vendorName}`);
    } else {
        // If vendor does not exist, add the vendor to the database and add the data ID to the vendor's record.
        addVendor(vendorName);
        addDataToBuffer(type, data, vendorName);
        res.json("Data received and stored");
    }
    });
    con.end();
}

// Generates a unique 8 digit ID.
function generateID(){
    let length = 8;
    let result = '';
    const characters =
        '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// Creates a link isntance between a vendor and a data entry inside the data_links table.
function linkData(vendorName, dataId){  
    const con = connectSQL();
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

// Retrieves the count of all pending data in the buffer table. 
function getPendingDataCount(req, res){
    const con = connectSQL();
    con.query("SELECT COUNT(*) as count FROM data_buffer;", (err, result) =>
        {
            if (err) throw err;
            res.json(result[0].count);
        });
    con.end();
}

// Retrieves all instances in the buffer table.
function getPendingData(req, res){
    const con = connectSQL();
    con.query("SELECT * FROM data_buffer;", (err, result) =>
        {
            if (err) throw err;
            res.json(result);
        });
    con.end();
}

// Deletes a specified data from the buffer table.
function deleteData(req, res){
    const dataID = req.body.id;
    console.log(`Deleting data with ID ${dataID}`);
    deleteDataFromBuffer(dataID);
    res.json("Data deleted from buffer");
}

// Gets data types for a specific vendor to be displayed on the vendor list.
function getVendorDataTypes(req, res){
    const vendorId = req.body.vendor_id;
    const con = connectSQL();
    con.query('SELECT vendor_id, data_type FROM data_links, user_data WHERE user_data.data_id = data_links.data_id AND vendor_id = ?;', [vendorId], (err, result) => {
        if (err) throw err;
        let dataTypes = [];
        for (const DT of result){
            if (!dataTypes.includes(DT.data_type))
            dataTypes.push(DT.data_type); 
        } 
        res.json(dataTypes);
    });
    con.end();
}

function getUserDataList(req, res){
    const con = connectSQL();
    con.query("SELECT DISTINCT data_type, data FROM vendor_info, data_links, user_data WHERE vendor_info.vendor_id = data_links.vendor_id AND user_data.data_id = data_links.data_id;", (err, result) => {
        if (err) throw err;
        res.json(result);
    });
    con.end();
}

// Routes
app.get('/pendingData', getPendingData);
app.get('/verifyDataCount', getPendingDataCount);
app.get('/countVendors', countVendors);
app.get('/vendorList', getVendorList);
app.get('/getUserDataList', getUserDataList);
app.post('/getVendorDataTypes', express.json(), getVendorDataTypes);
app.post('/sendUserInfo', express.json(), recvInfo);
app.post('/removeVendor', express.json(), removeVendor);
app.post('/rejectData', express.json(), deleteData);
app.post('/verifyData', express.json(), moveVerifiedData);
app.post('/deleteVendor', express.json(), removeVendor);

