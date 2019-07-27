const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const Device = require('./models/device');
const User = require('./models/user');
const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(function (req, res, next) {
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

app.get('/docs', (req, res) => {
	res.sendFile(`${__dirname}/public/generated-docs/index.html`);
});

/**
* @api {get} /api/devices AllDevices An array of all devices
* @apiVersion 1.1.0
* @apiGroup Device
* @apiSuccessExample {json} Success-Response:
* {
* 	"success": true,
* 	"message": "Array of all Devices",
* 	"data": [
* 		{
* 			"_id": "5d297b30760baa4303ce125c",
* 			"name": "Bob's Samsung Galaxy",
* 			"user": "bob",
* 			"sensorData": [
* 				{
* 					"ts": "1529545935",
* 					"temp": 25,
* 					"loc": {
* 						"lat": -37.839587,
* 						"lon": 145.101386
* 					}
* 				}
* 			]
* 		},
* 		{
* 			"_id": "5d297b30760baa4303ce1260",
* 			"name": "Mary's iPhone",
* 			"user": "mary123",
* 			"sensorData": [
* 				{
* 					"ts": "1529542743",
* 					"temp": 14,
* 					"loc": {
* 						"lat": 33.812092,
* 						"lon": -117.918974
* 					}
* 				}
* 			]
* 		}
* 	]
* }
*/
app.get('/api/devices', (req, res) => {
	Device.find({}, (err, devices) => {
		return err ? res.json(returnJSON(false, err))
			: res.json(returnJSON(true, "Array of all Devices", devices));
	});
});

/**
* @api {post} /api/devices CreateDevice Creates a new device
* @apiVersion 1.1.0
* @apiGroup Device
* @apiParam {String} name Name of the device
* @apiParam {String} user User of the device. (usually the username)
* @apiParam {Array} [sensorData] An array of device's sensor data
* @apiSuccessExample {json} Success-Response:
* {
* 	"success": true,
* 	"message": "Array of all Devices",
* 	"data": {
* 		"newDevice": {
* 			"_id": "5d297b30760baa4303ce125c",
* 			"name": "Bob's Samsung Galaxy",
* 			"user": "bob",
* 			"sensorData": [
* 				{
* 					"ts": "1529545935",
* 					"temp": 25,
* 					"loc": {
* 						"lat": -37.839587,
* 						"lon": 145.101386
* 					}
* 				}
* 			]
* 		}
* 	}
* }
*/
app.post('/api/devices', (req, res) => {
	const { name, user, sensorData } = req.body;
	const newDevice = new Device({
		name,
		user,
		sensorData
	});
	newDevice.save(err => {
		return err ? res.json(returnJSON(false, err))
			: res.json(returnJSON(true, "Device Added", { newDevice: newDevice }));
	});
});

/**
* @api {post} /api/register CreateAccount Creates a new user account
* @apiVersion 1.1.0
* @apiGroup User
* @apiParam {String} name Username
* @apiParam {String} password Password
* @apiParam {Boolean} isAdmin Whether the registered user is an admin or not
* @apiSuccessExample {json} Success-Response:
* {
* 	"success": true,
* 	"message": "Created New User"
* }
* @apiErrorExample {json} Error-Response:
* {
* 	"success": false,
* 	"message": "Username Exists"
* }
*/
app.post('/api/register', (req, res) => {
	const { name, password, isAdmin } = req.body;
	User.findOne({ name: name }, (err, user) => {
		if (err) return res.json(returnJSON(false, err));
		if (user) return res.json(returnJSON(false, "Username Exists"));
		const newUser = new User({
			name,
			password,
			isAdmin
		});
		newUser.save(err => {
			return err ? res.json(returnJSON(false, err))
				: res.json(returnJSON(true, 'Created New User'));
		});
	});
});

/**
* @api {post} /api/authenticate LogIn Logs in an account
* @apiVersion 1.1.0
* @apiGroup User
* @apiParam {String} name Username
* @apiParam {String} password User's Password
* @apiSuccessExample {json} Success-Response:
* {
* 	"success": true,
* 	"message": "Autheticated Successfully",
* 	"data": {
* 		"isAdmin": true
* 	}
* }
* @apiErrorExample {josn} Error-Response:
* {
* 	"success": false,
* 	"message": "Wrong Credentials"
* }
*/
app.post('/api/authenticate', (req, res) => {
	const { name, password } = req.body;
	User.findOne({ name: name }, (err, user) => {
		if (err)
			return res.json(returnJSON(false, err));
		if (!user || password !== user.password) return res.json(returnJSON(false, "Wrong Credentials"));
		return res.json(returnJSON(true, "Autheticated Successfully", { isAdmin: user.isAdmin }));
	});
});

/**
* @api {get} /api/devices/:deviceId/device-history DeviceHistory Device Sensor Data History
* @apiVersion 1.1.0
* @apiParam {String} deviceId Device's unique identifier
* @apiGroup Device
* @apiSuccessExample {json} Success-Response:
* {
* 	"success": true,
* 	"message": "iPhone's Data",
* 	"data": {
* 		"sensorData": [
* 			{
* 				"ts": "1529545935",
* 				"temp": 25,
* 				"loc": {
* 					"lat": -37.839587,
* 					"lon": 145.101386
* 				}
* 			}
* 		]
* 	}
* }
* @apiErrorExample {json} Error-Response:
* {
* 	"success": false,
* 	"message": "Unknown Device ID"
* }
*/
app.get('/api/devices/:deviceId/device-history', (req, res) => {
	const { deviceId } = req.params;
	Device.findById(deviceId, (err, device) => {
		if (!device) return res.json(returnJSON(false, "Unknown Device ID"));
		if (err) return res.json(returnJSON(false, err));
		const { sensorData } = device;
		return res.json(returnJSON(true, `${device.name}'s Data`, { sensorData: sensorData }));
	});
});

/**
* @api {get} /api/users/:user/devices UserDevices Array of all user's devices
* @apiVersion 1.1.0
* @apiParam {String} user Username
* @apiGroup Device
* @apiSuccessExample {json} Success-Response:
* {
* 	"success": true,
* 	"message": "Abood Devices",
* 	"data": [
* 		{
* 			"_id": "5d297b30760baa4303ce125c",
* 			"name": "Abood's Samsung Galaxy",
* 			"user": "Abood",
* 			"sensorData": [
* 				{
* 					"ts": "1529545935",
* 					"temp": 25,
* 					"loc": {
* 						"lat": -37.839587,
* 						"lon": 145.101386
* 					}
* 				}
* 			]
* 		},
* 		{
* 			"_id": "5d297b30760baa4303ce1260",
* 			"name": "Abood's iPhone",
* 			"user": "Abood",
* 			"sensorData": [
* 				{
* 					"ts": "1529542743",
* 					"temp": 14,
* 					"loc": {
* 						"lat": 33.812092,
* 						"lon": -117.918974
* 					}
* 				}
* 			]
* 		}
* 	]
* }
* @apiErrorExample {json} Error-Response:
* {
* 	"success": false,
* 	"message": "No Devices"
* }
*/
app.get('/api/users/:user/devices', (req, res) => {
	const { user } = req.params;
	Device.find({ "user": user }, (err, devices) => {
		if (err) return res.json(returnJSON(false, err));
		if (!devices.length) return res.json(returnJSON(false, "No Devices"));
		return res.json(returnJSON(true, `${user} Devices`, { devices: devices }));
	});
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});