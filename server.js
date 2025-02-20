//CREATE TABLE COMMANDS
//CREATE TABLE user_data (id INT UNIQUE NOT NULL, type VARCHAR(32) NOT NULL, data VARCHAR(255));
//CREATE TABLE vendor_info (vendor_id INT NOT NULL, vendor_name VARCHAR(64), linked_data VARCHAR(255));

import express from 'express';
import { promises as fs } from 'fs';

import mysql from 'mysql';

// Set up server
const app = express();
const webRoot = './';
app.use(express.static(webRoot));
app.listen(8080);

// Server Functions

var corsMiddleware = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, PATCH, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization');

    next();
}

app.use(corsMiddleware);

function connectSQL(){
    const con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "8592",
        database: "pdv"
      });
    con.connect(function(err) {
        if (err) throw err;
    });
    return con;
}

function countVendors(req, res){
    const con = connectSQL();
    con.query("SELECT COUNT(*) as count FROM vendor_info;", (err, result) =>
        {
            if (err) throw err;
            res.json(result[0].count);
        });
    con.end();
}

function addVendor(vendorID, name){
    const linkedData = "NULL";
    const con = connectSQL();
    con.query('INSERT INTO vendor_info VALUES (?,?,?)', [vendorID, name, linkedData], (err) =>
        {
            if (err) throw err;
        })
    con.end();
}

function removeVendor(req, res) {
    const con = connectSQL();
    const name = req.body.name;

    con.query("DELETE FROM vendor_info WHERE vendor_name = ?", [name], (err, result) =>
        {
            if (err) throw err;
            res.json("Vendor deleted");
        })
    con.end();
};

function getVendorList(req, res) {
    const con = connectSQL();
    con.query("SELECT * FROM vendor_info", (err, result) =>
        {
            if (err) throw err;
            res.json(result);
        })
    con.end();
}

function addData(datatype, data){
    let id = generateID()
    const con = connectSQL();
    con.query("INSERT INTO user_data VALUES (?, ?, ?);", [id, datatype, data], (err, result, id) =>
        {
            if (err) throw err;
        })
    con.end();
    return id;
}

function recvInfo(req, res){
    const vendorId = req.body.id;
    const vendorName = req.body.name;
    const type = req.body.datatype;
    const data = req.body.data;
    
    addVendor(vendorId, vendorName);
    let dataID = addData(type, data);
    updateLinkedData(vendorName, dataID);
}

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

function writeLinkedData(vendorName, data){
    const con = connectSQL();
    con.query('UPDATE vendor_info SET linked_data = ? WHERE vendor_name = ?;', [data, vendorName], (err, result) => {
        if (err) throw err;
        console.log(result);
    })
    con.end();
}

function updateLinkedData(vendorName, newData){
    const readLinkedData = (vendorName, newData) => {
        const con = connectSQL();
        con.query("SELECT linked_data FROM vendor_info WHERE vendor_name = ?;", [vendorName], (err, result) => {
            if (err) throw err;
            console.log(result);
            // if (!result){
            //     if (result[0].linked_data != "NULL"){
            //         writeLinkedData(vendorName, `${result[0].linked_data},${newData}`);
            //     } else {
            //         writeLinkedData(vendorName, `${newData}`);
            //     }
            // } else {
            //     readLinkedData(vendorName, newData);
            // }
        });
        con.end();
    }
    readLinkedData(vendorName, newData);
}

app.get('/countVendors', countVendors);
app.get('/vendorList', getVendorList);
app.post('/sendUserInfo', express.json(), recvInfo);
app.post('/removeVendor', express.json(), removeVendor);
