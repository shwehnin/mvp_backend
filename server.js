require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require("./src/config/db");
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    })
}).catch((err) => {
    console.error(`Failed to start server: `, err);
    process.exit(1);
})
