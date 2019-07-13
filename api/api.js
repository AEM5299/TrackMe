const express = require('express')
const app = express();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });
const Device = require('./models/device');
const port = process.env.PORT || 5000;

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