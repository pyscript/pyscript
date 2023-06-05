const { readFileSync } = require("fs");

require("http")
    .createServer((req, res) => {
        const content = readFileSync(__dirname + req.url);
        res.setHeader("Access-Control-Allow-Origin", "*");
        setTimeout(() => {
            res.end(content);
        }, 1000);
    })
    .listen(7357);
