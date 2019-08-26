$("#navbar").load("navbar.html");
$("#footer").load("footer.html");

const currentUser = localStorage.getItem('user');
//const API_URL = 'https://aafifi-sit-209-ddszsqyel.now.sh/api';
const API_URL = 'http://localhost:5000/api';
const MQTT_URL = 'https://aafifi-mqtt-sit-209.now.sh';

if(currentUser) {
	$.get(`${API_URL}/users/${currentUser}/devices`)
	.then(res => {
		res.data.devices.forEach( device => {
			$('#devices tbody').append(`
			<tr data-device-id=${device._id}>
				<td class="UserCol">${device.user}</td>
				<td class="nameCol">${device.name}</td>
				<td class="mapcol"><i class="fas fa-search-location"></i></td>
			</tr>
			`);
		});
		addDeviceEventHandlers();
	})
	.catch(err => {
		console.error(`Error: ${err}`);
	});
} else {
	const path = window.location.pathname;
	if(path !== '/login' && path !== '/register') location.href = '/login';
}

function addDeviceEventHandlers() {
	$('#devices tbody tr td .fa-search-location').on('click', e => {
		const deviceid = e.currentTarget.closest('tr').getAttribute('data-device-id');
		$('#mapModal').modal('show');
		$.get(`${API_URL}/devices/${deviceid}/device-history`)
		.then(res => {
			const LatLng = new google.maps.LatLng(res.data.sensorData[0].loc.lat, res.data.sensorData[0].loc.lon)
			const map = new google.maps.Map(document.getElementById('map_canvas'), {
				center: LatLng,
				zoom: 8
			});
			var marker = new google.maps.Marker({position: LatLng, map: map, title: res.message.substring(0, res.message.length - 7), label: "A"});
		});
	});
	$('#devices tbody tr :not(.mapcol, .fa-search-location)').on('click', e => {
		const deviceId = e.currentTarget.closest("tr").getAttribute('data-device-id');
		$.get(`${API_URL}/devices/${deviceId}/device-history`)
		.then(res => {
			$('#historyContent').empty();
			res.data.sensorData.map(sensorData => {
				$('#historyContent').append(`
				<tr>
					<td>${sensorData.ts}</td>
					<td>${sensorData.temp}</td>
					<td>${sensorData.loc.lat}</td>
					<td>${sensorData.loc.lon}</td>
				</tr>
				`);
			});
			$('#historyModal').modal('show');
		});
	});
}

$('#add-device').on('click', () => {
	const user = $("#user").val();
	const name = $("#name").val();
	const sensorData = [];

	const body = {
		name,
		user,
		sensorData
	};

	$.post(`${API_URL}/devices`, body).then(response => {
		location.href = '/';
	})
	.catch(error => {
		console.error(`Error: ${error}`);
	});
});

$('#send-command').on('click', () => {
	const command = $('#command').val();
	const deviceId = $('#deviceId').val();
	const body = {
		deviceId,
		command
	};
	$.post(`${MQTT_URL}/send-command`, body).then(response => {
		location.href = '/';
	})
	.catch(err => {
		console.error(`Error: ${err}`);
	});
});

$('#register').on('click', () => {
	const username = $('#username').val();
	const password = $('#password').val();
	const confirm = $('#confirm-password').val();
	if (!(password === confirm)) {
		$('#message').text("Password doesn't match").show();
	} else {
		$.post(`${API_URL}/register`, {name: username, password: password, isAdmin: true})
		.then( res => {
			if(res.success) {
				location.href = '/login';
			} else {
				$('#message').text(res.message).show();
			}
		});
	}
});

$('#login').on('click', () => {
	const username = $('#username').val();
	const password = $('#password').val();
	$.post(`${API_URL}/authenticate`, { name: username, password: password })
	.then( res => {
		if(res.success) {
			localStorage.setItem('user', username);
			localStorage.setItem('isAdmin', res.data.isAdmin);
			location.href = '/';
		} else {
			$('#message').text(res.message).show();
		}
	});
});

const logout = () => {
	localStorage.removeItem('user');
	localStorage.removeItem('isAdmin');
	location.href = "/login";
};