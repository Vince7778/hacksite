const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const passwords = require("./passwords.json");
const fs = require("fs");
const https = require("https");

const urlencodedParser = bodyParser.urlencoded({ extended: false })
const jsonParser = bodyParser.json({strict: false});

const domain = fs.readFileSync("domain.txt");
const privKey = fs.readFileSync(path.join(__dirname, "sslcert/"+domain+".key"));
const cert = fs.readFileSync(path.join(__dirname, "sslcert/"+domain+".csr"));
const app = express();
const port = 443;
const server = https.createServer({key: privKey, cert: cert}, app);

let winnerNames = {names:[]};

const WINNERS_PATH = path.join(__dirname, "/winners.json");
if (fs.existsSync(WINNERS_PATH)) {
    const rawRead = fs.readFileSync(WINNERS_PATH);
    winnerNames = JSON.parse(rawRead);
}

let winnerCount = winnerNames.names.length || 0;

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

app.post("/login", jsonParser, (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const hasWon = req.body.hasWon;
    console.log("attempt", req.ip, username, password);

    if (username === passwords.user1 && password === passwords.pass1) {
        console.log("password success");
        if (hasWon !== "1") winnerCount++;
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

app.post("/winner", jsonParser, (req, res) => {
    const sname = req.body.sname;
    const hasSubmitted = req.body.hasSubmitted;

    if (hasSubmitted) {
        res.redirect("/winner?failed=1&pass="+passwords.pass1);
        return;
    }

    console.log("submitname", req.ip, sname);
    winnerNames.names.push({
        name: sname
    });
    fs.writeFile("winners.json", JSON.stringify(winnerNames), () => {});
    res.redirect("/winner?success=1&pass="+passwords.pass1);
});

app.get("/forgot", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/forgot/index.html"))
});

app.post("/forgot", jsonParser, (req, res) => {
    let json = req.body;
    // user always does not exist for our purposes

    if (!json) {
        res.send(JSON.stringify({
            success: false,
            error: "Server error",
            password: ""
        }));
        return;
    }

    if (json.username !== "admin") {
        res.send(JSON.stringify({
            success: false,
            error: "User does not exist",
            password: ""
        }));
        return;
    }

    if (json.isAdmin) {
        res.send(JSON.stringify({
            success: true,
            error: "",
            password: passwords.pass1
        }));
        return;
    }

    res.send(JSON.stringify({
        success: false,
        error: "You are not the admin user!",
        password: ""
    }));
})

app.get("/api/winnerCount", (req, res) => {
    res.send(winnerCount.toString());
});

const imageDir = path.join(__dirname, "hosted");

app.use("/hosted", express.static(imageDir));

server.listen(port, () => {
    console.log("listening");
});