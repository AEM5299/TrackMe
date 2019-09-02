const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const Device = require('./models/device');
const User = require('./models/user');
const passport = require('passport');
const jwt = require('jsonwebtoken');
var JwtStrategy = require('passport-jwt').Strategy,
	ExtractJwt = require('passport-jwt').ExtractJwt;
const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });
const app = express();


passport.use(new JwtStrategy({
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: process.env.JWT_SECRET
},
	(jwtPayload, cb) => {
		return User.findById(jwtPayload.id)
			.then(user => {
				return cb(null, {
					id: user._id,
					name: user.name,
					is_admin: user.is_admin
				});
			})
			.catch(err => {
				return cb(err);
			});
	}
));

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept Access-Control-Allow-Headers, Authorization, X-Requested-With");
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
app.get('/api/devices', passport.authenticate('jwt', { session: false }), (req, res) => {
	Device.find({user: req.user.name}, (err, devices) => {
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
app.post('/api/devices', passport.authenticate('jwt', { session: false }), (req, res) => {
	const { name, sensorData } = req.body;
	const user = req.user.name;
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
* 		"token": "JWT-TOKEN"
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
	User.findOne({name, password})
	.then(user => {
		console.log(user);
		if(!user) res.json(returnJSON(false, "Wrong Credentials"));
		const payload = { id: user._id, name: user.name };
		const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
		res.json(returnJSON(true, "Autheticated Successfully", { token }));
	})
	.catch(err => {
		console.log(err);
		res.status(500).json(returnJSON(false, "Server Error", { err }));
	})
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
app.get('/api/devices/:deviceId/device-history', passport.authenticate('jwt', { session: false }), (req, res) => {
	const { deviceId } = req.params;
	Device.findById(deviceId, (err, device) => {
		if (!device || device.user != req.user.name) return res.json(returnJSON(false, "Unknown Device ID"));
		if (err) return res.json(returnJSON(false, err));
		const { sensorData } = device;
		return res.json(returnJSON(true, `${device.name}'s Data`, { sensorData: sensorData.sort(function (a, b) { return b.ts - a.ts }) }));
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
app.get('/api/users/:user/devices', passport.authenticate('jwt', { session: false }), (req, res) => {
	const { user } = req.params;
	Device.find({ "user": user }, (err, devices) => {
		if (err) return res.json(returnJSON(false, err));
		if(user != req.user.name && !req.user.is_admin) return res.status(401).json(returnJSON(false, "Unauthorized"))
		if (!devices.length) return res.json(returnJSON(false, "No Devices"));
		return res.json(returnJSON(true, `${user} Devices`, { devices: devices }));
	});
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});