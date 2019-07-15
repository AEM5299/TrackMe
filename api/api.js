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

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-RequestedWith, Content-Type, Accept");
	next();
});

app.use(express.static(`${__dirname}/public/generated-docs`));

app.get('/docs', (req, res) => {
	res.sendFile(`${__dirname}/public/generated-docs/index.html`);
});

/**
* @api {get} /api/devices AllDevices An array of all devices
* @apiVersion 1.0.0
* @apiGroup Device
* @apiSuccessExample {json} Success-Response:
* [
* 	{
* 		"_id": "dsohsdohsdofhsofhosfhsofh",
* 		"name": "Mary's iPhone",
* 		"user": "mary",
* 		"sensorData": [
* 			{
* 				"ts": "1529542230",
* 				"temp": 12,
* 				"loc": {
* 					"lat": -37.84674,
* 					"lon": 145.115113
* 				}
* 			},
* 			{
* 				"ts": "1529572230",
* 				"temp": 17,
* 				"loc": {
* 					"lat": -37.850026,
* 					"lon": 145.117683
* 				}
* 			}
* 		]
* 	}
* ]
*/
app.get('/api/devices', (req, res) => {
	Device.find({}, (err, devices) => {
		return err? res.send(err)
		: res.send(devices);
	});
});

/**
* @api {post} /api/devices CreateDevice Creates a new device
* @apiVersion 1.0.0
* @apiGroup Device
* @apiParam {String} name Name of the device
* @apiParam {String} user User of the device. (usually the username)
* @apiParam {Array} [sensorData] An array of device's sensor data
* @apiSuccessExample {text} Success-Response:
* "Device Added"
*/
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

/**
* @api {post} /api/register CreateAccount Creates a new user account
* @apiVersion 1.0.0
* @apiGroup User
* @apiParam {String} name Username
* @apiParam {String} password Password
* @apiParam {Boolean} isAdmin Whether the registered user is an admin or not
* @apiSuccessExample {json} Success-Response:
* [
* 	{
* 		"success": true,
* 		"message": "Created New User"
* 	}
* ]
* @apiErrorExample {text} Error-Response:
* 	"Username Exists"
*/
app.post('/api/register', (req, res) => {
	const {name, password, isAdmin} = req.body;
	User.findOne({name: name}, (err, user) => {
		if(err) return res.send(err);
		if(user) return res.send("Username Exists!");
		const newUser = new User({
			name,
			password,
			isAdmin
		});
		newUser.save(err => {
			return err? res.send(err)
			: res.json({
				success: true,
				message: 'Created New User'
			});
		});
	});
})

/**
* @api {post} /api/authenticate LogIn Logs in an account
* @apiVersion 1.0.0
* @apiGroup User
* @apiParam {String} name Username
* @apiParam {String} password User's Password
* @apiSuccessExample {json} Success-Response:
* [
* 	{
* 		"success": true,
* 		"message": "Autheticated Successfully"
* 		"isAdmin": true
* 	}
* ]
* @apiErrorExample {text} Error-Response:
* 	"Wrong Credentials"
*/
app.post('/api/authenticate', (req, res) => {
	const {name, password} = req.body;
	User.findOne({name: name}, (err, user) => {
		if(err)
			return res.send(err);
		if(user) {
			return !(password === user.password)? res.send("Wrong Credentials")
			: res.json({
				success: true,
				message: "Autheticated Successfully",
				isAdmin: user.isAdmin
			});
		} else {
			return res.send("Wrong Credentials");
		}
	});
});

/**
* @api {get} /api/devices/:deviceId/device-history DeviceHistory Device Sensor Data History
* @apiVersion 1.0.0
* @apiParam {String} deviceId Device's unique identifier
* @apiGroup Device
* @apiSuccessExample {json} Success-Response:
* [
* 	{
* 		"ts": "1529542230",
* 		"temp": 12,
* 		"loc": {
* 			"lat": -37.84674,
* 			"lon": 145.115113
* 		}
* 	}
* ]
* @apiErrorExample {text} Error-Response:
* 	"Unknown Device ID"
*/
app.get('/api/devices/:deviceId/device-history', (req, res) => {
	const { deviceId } = req.params;
	Device.findOne({"_id": deviceId}, (err, device) => {
		if(!device) return res.send("Unknown Device ID")
		const { sensorData } = device;
		return err? res.send(err)
		: res.send(sensorData);
	});
});

/**
* @api {get} /api/users/:user/devices UserDevices Array of all user's devices
* @apiVersion 1.0.0
* @apiParam {String} user Username
* @apiGroup Device
* @apiSuccessExample {json} Success-Response:
* [
* 	{
* 		"_id": "dsohsdohsdofhsofhosfhsofh",
* 		"name": "Mary's iPhone",
* 		"user": "mary",
* 		"sensorData": [
* 			{
* 				"ts": "1529542230",
* 				"temp": 12,
* 				"loc": {
* 					"lat": -37.84674,
* 					"lon": 145.115113
* 				}
* 			}
* 		]
* 	},
* 	{
* 		"_id": "quyrmrjwpsd1284ofsfhsofh",
* 		"name": "Abood's iPhone",
* 		"user": "Abood",
* 		"sensorData": [
* 			{
* 				"ts": "1529542230",
* 				"temp": 25,
* 				"loc": {
* 					"lat": -37.84674,
* 					"lon": 145.115113
* 				}
* 			}
* 		]
* 	}
* ]
*/
app.get('/api/users/:user/devices', (req, res) => {
	const { user } = req.params;
	Device.find({ "user" : user}, (err, devices) => {
		return err? res.send(err)
		: res.send(devices);
	});
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});