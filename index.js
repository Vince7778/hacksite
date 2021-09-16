const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const passwords = require("./passwords.json");
const fs = require("fs");

const urlencodedParser = bodyParser.urlencoded({ extended: false })

const app = express();
const port = 80;

let users = [];
let winnerNames = {names:[]};
let winnerCount = 0;

function getUser(ip) {
    return users.find(v => v.ip === ip);
}

function getAttempts(ip) {
    let fnd = getUser(ip);
    if (!fnd) {
        users.push({
            "ip": ip,
            "attempts": 10,
            "won": false
        });
        return 10;
    }
    return fnd.attempts;
}



app.get("/", (req, res) => {
    console.log("sending")
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
    if (getAttempts(req.ip) <= 0) {
        res.redirect("/login?attemptOut=1");
        return;
    }

    let username = req.body.username;
    let password = req.body.password;
    console.log("attempt", req.ip, username, password);

    if (username === passwords.user1 && password === passwords.pass1) {
        console.log("password success");
        const ip = req.ip;
        const user = getUser(ip);
        if (!user) {
            users.push({
                "ip": ip,
                "attempts": 9,
                "won": true
            });
            winnerCount++;
        } else {
            if (!user.won) winnerCount++;
            user.won = true;
            user.attempts--;
        }
        res.redirect("/winner");
    } else {
        const ip = req.ip;
        const user = getUser(ip);
        if (!user) {
            users.push({
                "ip": ip,
                "attempts": 9,
                "won": false
            });
        } else {
            user.attempts--;
        }
        console.log("password failure");
        res.redirect("/login?failed=1");
    }
});

app.get("/winner", (req, res) => {
    const user = getUser(req.ip);
    if (!user || !user.won) {
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
    res.send(winnerCount.toString());
});

app.get("/api/attemptCount", (req, res) => {
    res.send(getAttempts(req.ip).toString());
});

app.listen(port, () => {
    console.log("listening");
});