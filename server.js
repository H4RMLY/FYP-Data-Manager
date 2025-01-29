import express from 'express';
import { promises as fs } from 'fs';

import mysql from 'mysql';

// Set up server
const app = express();
const webRoot = './';
app.use(express.static(webRoot));
app.listen(8080);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

// Server Functions

function connectSQL(){
    const con = mysql.createConnection({
        host: "localhost",
        user: "harmly",
        password: "AMv720tPS@",
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
    con.query("SELECT COUNT(*) as count FROM testvendors;", (err, result) => 
        {
            if (err) throw err;
            res.json(result[0].count);
        })
    con.end();
}

function addVendor(req, res) {
    const con = connectSQL();
    const vendorID = req.body.id;
    const name = req.body.name;

    con.query("INSERT INTO testvendors VALUES (?,?)", [vendorID, name], (err, result) => 
        {
            if (err) throw err;
            res.json("Vendor Added");
        })
    con.end();
}

function removeVendor(req, res) {
    const con = connectSQL();
    const name = req.body.name;

    con.query("DELETE FROM testvendors WHERE vendor_name = ?", [name], (err, result) => 
        {
            if (err) throw err;
            res.json("Vendor deleted");
        })
    con.end();
};

app.get('/countVendors', countVendors);
app.post('/addVendor', express.json(), addVendor);
app.post('/removeVendor', express.json(), removeVendor);
