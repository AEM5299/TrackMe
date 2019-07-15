const mqtt = require('mqtt');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const { URL, USERNAME, PASSWORD } = process.env;
const port = process.env.PORT || 5001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

const client = mqtt.connect(URL, {
	username: USERNAME,
	password: PASSWORD
});

client.on('connect', () => {
	console.log('MQTT Connected');
});

app.listen(port, () => {
	console.log(`MQTT server listening on port ${port}`);
})