/**
 * Static server for the Node.js Learnings app.
 *
 * Why this exists:
 *   The main index.html loads each module's index.html + index.js using fetch().
 *   Browsers block fetch() on the file:// protocol (CORS), so opening index.html
 *   directly will NOT load module content. Run this small Express server instead.
 *
 *   $ npm install        (one time, installs express)
 *   $ npm start          (or: node server.js)
 *   open http://localhost:3000
 *
 * This server is itself the simplest possible Express example.
 */
const express = require('express');
const path = require('path');
// dotenv
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve every file in this directory (index.html, app.js, module folders, ...)
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`\n  Node.js Learnings running:  http://localhost:${PORT}\n`);
});
