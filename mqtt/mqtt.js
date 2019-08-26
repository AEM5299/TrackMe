const mqtt = require('mqtt');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const rand = require('random-int');
const randomCoordinates = require('random-coordinates');
const Device = require('./models/device');

const app = express();
const { URL, USERNAME, PASSWORD } = process.env;
const port = process.env.PORT || 5001;
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-RequestedWith, Content-Type, Accept");
	next();
});

app.use(express.static(`${__dirname}/public/generated-docs`));

function returnJSON(success, message, data) {
	return {
		success: success,
		message: message,
		data: data
	};
}

const client = mqtt.connect(URL, {
	username: USERNAME,
	password: PASSWORD
});

client.on('connect', () => {
	console.log('MQTT Connected');
	client.subscribe('/sensorData');
});

client.on('message', (topic, message) => {
	if(topic == '/sensorData') {
		const data = JSON.parse(message.toString());
		console.log(data);

		Device.findById(data.deviceId, (err, device) => {
			if(err) console.log(err);
			if(!device) return;
			const { sensorData } = device;
			const { ts, loc, temp } = data;

			sensorData.push({ts, loc, temp});
			device.sensorData = sensorData;

			device.save(err => {
				if(err) console.log(err);
			});
		});

	}
});

app.get('/docs', (req, res) => {
	res.sendFile(`${__dirname}/public/generated-docs/index.html`);
});

/**
* @api {put} /sensor-data FakeSensorData Create a set of fake data and puplish it to the mqtt server
* @apiVersion 1.0.0
* @apiGroup Device
* @apiParam {String} deviceId Device's name
* @apiSuccessExample {json} Success-Response:
* {
* 	"success": true,
* 	"message": "Fake data sent",
* 	"data": {
* 		deviceId: 'Mary's iPhone',
* 		ts: 1564267719763,
* 		loc: {
* 			lat: '-51.09538',
* 			lon: '142.02451'
* 		},
* 		temp: 30
* 	}
* }
*/
app.put('/sensor-data', (req, res) => {
	const {deviceId} = req.body;
	const [lat, lon] = randomCoordinates().split(", ");
	const ts = new Date().getTime();
	const loc = {lat, lon};
	const temp = rand(20, 50);
	const topic = '/sensorData';
	const message = JSON.stringify({deviceId, ts, loc, temp});

	client.publish(topic, message, () => {
		return res.json(returnJSON(true, "Fake data sent", {deviceId, ts, loc, temp}));
	});
});

/**
* @api {post} /send-command SendCommand Sends a command through the mqtt server
* @apiVersion 1.0.0
* @apiGroup Device
* @apiParam {String} deviceId Device's name
* @apiParam {String} command The command
* @apiSuccessExample {json} Success-Response:
* {
* 	"success": true,
* 	"message": "Command published"
* }
*/
app.post('/send-command', (req, res) => {
	const { deviceId, command } = req.body;
	const topic = `/command/${deviceId}`;
	client.publish(topic, command, () => {
		return res.json(returnJSON(true, "Command published"));
	});
});

app.listen(port, () => {
	console.log(`MQTT server listening on port ${port}`);
});