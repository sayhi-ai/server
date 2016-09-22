import express from 'express';

const app = express();

// Serve bundle
app.get('*.js', (req, res) => {
});

// Serve index page
app.get('*', (req, res) => {
});

// Express server
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log('Essential React listening at http://%s:%s', host, port);
});