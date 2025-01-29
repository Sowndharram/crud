const http = require('http');
const url = require('url');
const querystring = require('querystring');
const { MongoClient } = require('mongodb');

// MongoDB connection URI
const uri = 'mongodb://localhost:27017'; // Replace 'localhost' and '27017' with your MongoDB server details
const client = new MongoClient(uri);

// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

connectDB();

async function onRequest(req, res) {
    const path = url.parse(req.url).pathname;
    console.log('Request for ' + path + ' received');

    const query = url.parse(req.url).query;
    const params = querystring.parse(query);
    const ownername = params["ownername"];
    const vehicleid = params["vehicleid"];
    const vehicletype = params["vehicletype"];
    const plateno = params["plateno"];
    const registrationdate = params["registrationdate"];
    const address = params["address"];

    if (req.url.includes("/insert")) {
        await insertData(req, res, ownername, vehicleid, vehicletype, plateno, registrationdate, address);
    } else if (req.url.includes("/delete")) {
        await deleteData(req, res, vehicleid);
    } else if (req.url.includes("/update")) {
        await updateData(req, res, vehicleid, plateno);
    } else if (req.url.includes("/display")) {
        await displayTable(req, res);
    }
}

async function insertData(req, res, ownername, vehicleid, vehicletype, plateno, registrationdate, address) {
    try {
        const database = client.db('exp6'); // Replace 'yourDatabaseName' with your actual database name
        const collection = database.collection('vehicles');

        const vehicle = {
            ownername,
            vehicleid,
            vehicletype,
            plateno,
            registrationdate,
            address
        };

        const result = await collection.insertOne(vehicle);
        console.log(`${result.insertedCount} document inserted`);

        // HTML content for displaying the message in a table
        const htmlResponse = `
            <html>
                <head>
                    <title>Vehicle Details</title>
                    <style>
                        table {
                            font-family: Arial, sans-serif;
                            border-collapse: collapse;
                            width: 50%;
                            margin: 20px auto;
                        }
                        td, th {
                            border: 1px solid #dddddd;
                            text-align: left;
                            padding: 8px;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                    </style>
                </head>
                <body>
                    <h2>Vehicle Details</h2>
                    <table>
                        <tr>
                            <th>Field</th>
                            <th>Value</th>
                        </tr>
                        <tr>
                            <td>Owner Name</td>
                            <td>${ownername}</td>
                        </tr>
                        <tr>
                            <td>Vehicle ID</td>
                            <td>${vehicleid}</td>
                        </tr>
                        <tr>
                            <td>Vehicle Type</td>
                            <td>${vehicletype}</td>
                        </tr>
                        <tr>
                            <td>License Plate Number</td>
                            <td>${plateno}</td>
                        </tr>
                        <tr>
                            <td>Registration Date</td>
                            <td>${registrationdate}</td>
                        </tr>
                        <tr>
                            <td>Address</td>
                            <td>${address}</td>
                        </tr>
                    </table>
                    <a href="/display">View Inserted Table</a>
                </body>
            </html>
        `;

        // Write the HTML response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(htmlResponse);
        res.end();
    } catch (error) {
        console.error('Error inserting data:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

async function deleteData(req, res, vehicleid) {
    try {
        const database = client.db('exp6'); // Replace 'yourDatabaseName' with your actual database name
        const collection = database.collection('vehicles');

        // Construct the filter based on the vehicle ID
        const filter = { vehicleid: vehicleid };

        const result = await collection.deleteOne(filter);
        console.log(`${result.deletedCount} document deleted`);

        // Respond with appropriate message
        if (result.deletedCount === 1) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Document deleted successfully');
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Document not found');
        }
    } catch (error) {
        console.error('Error deleting data:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

async function updateData(req, res, vehicleid, newPlateno) {
    try {
        const database = client.db('exp6'); // Replace 'yourDatabaseName' with your actual database name
        const collection = database.collection('vehicles');

        // Construct the filter based on the vehicle ID
        const filter = { vehicleid: vehicleid };

        // Construct the update operation to set the new license plate number
        const updateDoc = {
            $set: { plateno: newPlateno } // Assuming 'plateno' is the field to update
        };

        const result = await collection.updateOne(filter, updateDoc);
        console.log(`${result.modifiedCount} document updated`);

        // Respond with appropriate message
        if (result.modifiedCount === 1) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('License plate number updated successfully');
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Vehicle ID not found');
        }
    } catch (error) {
        console.error('Error updating data:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

async function displayTable(req, res) {
    try {
        const database = client.db('exp6'); // Replace 'yourDatabaseName' with your actual database name
        const collection = database.collection('vehicles');

        const cursor = collection.find({});
        const vehicles = await cursor.toArray();

        // Generate HTML table dynamically based on retrieved documents
        let tableHtml = `
            <html>
                <head>
                    <title>Vehicle Details</title>
                    <style>
                        table {
                            font-family: Arial, sans-serif;
                            border-collapse: collapse;
                            width: 100%;
                        }
                        th, td {
                            border: 1px solid #dddddd;
                            text-align: left;
                            padding: 8px;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                    </style>
                </head>
                <body>
                    <h2>Vehicle Details</h2>
                    <table>
                        <tr>
                            <th>Owner Name</th>
                            <th>Vehicle ID</th>
                            <th>Vehicle Type</th>
                            <th>License Plate Number</th>
                            <th>Registration Date</th>
                            <th>Address</th>
                        </tr>
        `;
        vehicles.forEach(vehicle => {
            tableHtml += `
                <tr>
                    <td>${vehicle.ownername}</td>
                    <td>${vehicle.vehicleid}</td>
                    <td>${vehicle.vehicletype}</td>
                    <td>${vehicle.plateno}</td>
                    <td>${vehicle.registrationdate}</td>
                    <td>${vehicle.address}</td>
                </tr>
            `;
        });
        tableHtml += `
                    </table>
                </body>
            </html>
        `;

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(tableHtml);
        res.end();
    } catch (error) {
        console.error('Error displaying table:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

// Create HTTP server
http.createServer(onRequest).listen(7050);
console.log('Server is running...');
