const http = require('http');

const {URL} = require('url');

const server = http.createServer((req,res)=>{
    const url = new URL(req.url, `http://${req.headers.host}`)
    const route = `${req.method} ${url.pathname}`
    console.log(route);
    if(route === 'GET /user'){
        res.writeHead(200, "Fetched users", {accept: 'application/json'});
        return res.end(JSON.stringify({user: ['a', ['b']]}))
    }

    if(route === 'GET /hi'){
        const name = url.searchParams.get('name');
        res.end(`hi ${name}`)
    }
})

server.listen(3001, ()=>{
    console.log("started");
})