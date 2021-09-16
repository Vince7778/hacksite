const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const passwords = require("./passwords.json");
const fs = require("fs");

const urlencodedParser = bodyParser.urlencoded({ extended: false })

const app = express();
const port = 80;

let winnerNames = {names:[]};
let winnerCount = 0;

app.get("/", (req, res) => {
    console.log("sending", req.ip);
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
        winnerCount++;
        res.redirect("/winner?pass="+passwords.pass1);
    } else {
        console.log("password failure");
        res.redirect("/login?failed=1");
    }
});

app.get("/winner", (req, res) => {
    const pass = req.query.pass;
    if (!pass || pass !== passwords.pass1) {
        res.send("You do not have permission to access this page.");
        return;
    }

    res.sendFile(path.join(__dirname, "/static/winner/index.html"));
});

app.post("/winner", urlencodedParser, (req, res) => {
    let sname = req.body.sname;

    console.log("submitname", req.ip, sname);
    winnerNames.names.push({
        ip: req.ip,
        name: sname
    });
    fs.writeFile("winners.json", JSON.stringify(winnerNames), () => {});
    res.redirect("/winner?success=1&pass="+passwords.pass1);
});

app.get("/api/winnerCount", (req, res) => {
    res.send(winnerCount.toString());
});

app.listen(port, () => {
    console.log("listening");
});