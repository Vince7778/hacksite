const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const passwords = require("./passwords.json");
const fs = require("fs");

const urlencodedParser = bodyParser.urlencoded({ extended: false })

const app = express();
const port = 8080;

let winners = [];
let winnerNames = {names:[]};

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/index.html"));
});

app.get("/bootstrap.min.js", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/bootstrap.min.js"));
});

app.get("/bootstrap.min.css", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/bootstrap.min.css"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/login/index.html"));
});

app.post("/login", urlencodedParser, (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    console.log("attempt", req.ip, username, password);

    if (username === passwords.user1 && password === passwords.pass1) {
        console.log("password success");
        const ip = req.ip;
        if (winners.indexOf(ip) === -1) {
            winners.push(ip);
        }
        res.redirect("/winner");
    } else {
        console.log("password failure");
        res.redirect("/login?failed=1");
    }
});

app.get("/winner", (req, res) => {
    if (winners.indexOf(req.ip) === -1) {
        res.send("You do not have permission to access this page.");
        return;
    }

    res.sendFile(path.join(__dirname, "/static/winner/index.html"));
});

app.post("/winner", urlencodedParser, (req, res) => {
    let sname = req.body.sname;
    let inArray = winnerNames.names.find(v => v.ip === req.ip);

    if (!inArray) {
        console.log("submitname", req.ip, sname);
        winnerNames.names.push({
            ip: req.ip,
            name: sname
        });
        fs.writeFile("winners.json", JSON.stringify(winnerNames), () => {});
        res.redirect("/winner?success=1");
    } else {
        res.redirect("/winner?failed=1");
    }
});

app.get("/api/winnerCount", (req, res) => {
    res.send(winners.length.toString());
})

app.listen(port, () => {
    console.log("listening");
});