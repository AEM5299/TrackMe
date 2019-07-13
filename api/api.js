const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const Device = require('./models/device');
const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

const app = express();
app.use(bodyParser.json())

app.get('/api/devices', (req, res) => {
	Device.find({}, (err, devices) => {
		return err? res.send(err)
		: res.send(devices);
	});
});

app.post('/api/devices', (req, res) => {
	const {name, user, sensorData} = req.body;
	const newDevice = new Device({
		name,
		user,
		sensorData
	});
	newDevice.save(err => {
		return err? res.send(err)
		: res.send('Device Added.');
	});
});

app.post('/api/send-command', (req, res) => {
	console.log(req.body);
	res.send(req.body);
});

app.get('/api/test', (req, res) => {
	res.send('The API is Working!');
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});