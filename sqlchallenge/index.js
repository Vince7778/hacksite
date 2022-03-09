const express = require("express");
const router = express.Router();
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");

const flag = fs.readFileSync(path.join(__dirname, "flag.txt"));
const sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database(":memory:");

const regexClean = /.*;\s*(?!--)\S+/;

function setupDB() {
    db.run("CREATE TABLE Users (name TEXT, money TEXT)");
    db.run("CREATE TABLE Users_New (name TEXT, nickname TEXT, cash_in_dollars INTEGER)");

    db.run("INSERT INTO Users (name, money) VALUES ('Conor', 100), ('Mr. Osborne', 400), ('Aadit', -100), ('Thank you hacker!', 402), ('But our flag', 403), ('is in another table!', 404), ('(called \"Users_New\")', 405)");
    const randomValue = Math.floor(Math.random()*1000000);
    db.run(`INSERT INTO Users_New (name, nickname, cash_in_dollars) VALUES ('flag_${randomValue}', 'The answer is: ', ${flag})`);
}
db.serialize(setupDB);

router.use("/", express.static(path.join(__dirname, "static/index.html")));

router.get("/queryName", (req, res) => {
    const qry = req.query.name;
    if (!qry) {
        res.statusCode = 400;
        res.json({status:400,err:'No name queried'});
        return;
    }
    
    // !!! INTENTIONALLY VULNERABLE !!!
    const sqlQry = `SELECT * FROM Users WHERE name='${qry}'`;
    if (regexClean.test(sqlQry)) {
        res.statusCode = 400;
        res.json({status:400,err:'Cannot execute multiple statements'});
        return;
    }

    db.all(sqlQry, (err, rows) => {
        if (err) {
            console.log("Error", err.message);
            res.statusCode = 400;
            res.json({status:400,err:"Error with command " + sqlQry + ": "+err.message});
            return;
        }
        console.log(rows);
        res.json({status:200,res:rows});
    });
});

router.get("/resetTable123", (req, res) => {
    db.close();

    db = new sqlite3.Database(":memory:");
    db.serialize(setupDB);
    console.log("Reset table");
    res.json({status:200,res:"Reset table"});
});

module.exports = router;