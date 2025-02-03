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
    res.header('Access-Control-Allow-Origin', '*'); //replace localhost with actual host
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
        console.log("Connected!");
    });
    return con;
}

function countVendors(req, res){
    const con = connectSQL();
    con.query("SELECT COUNT(*) as count FROM vendor_info;", (err, result) =>
        {
            if (err) throw err;
            res.json(result[0].count);
            console.log(result[0].count);
        })
        con.end();
}

function addVendor(req, res) {
    const con = connectSQL();
    const vendorID = req.body.id;
    const name = req.body.name;

    con.query("INSERT INTO vendor_info VALUES (?,?)", [vendorID, name], (err, result) =>
        {
            if (err) throw err;
            res.json("Vendor Added");
            console.log(vendorID, name);
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
            console.log(name);
        })
    con.end();
};

app.get('/countVendors', countVendors);
app.post('/addVendor', express.json(), addVendor);
app.post('/removeVendor', express.json(), removeVendor);
