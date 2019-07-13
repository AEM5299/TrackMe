const express = require('express')
const app = express();
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://<username>:<password>@sit209-e7d7q.mongodb.net/TrackMe?retryWrites=true&w=majority', { useNewUrlParser: true });
const Device = require('./models/device');
const port = 5000;

app.get('/api/devices', (req, res) => {
	Device.find({}, (err, devices) => {
		return err? res.send(err)
		: res.send(devices);
	});
});

app.get('/api/test', (req, res) => {
	res.send('The API is Working!');
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});