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