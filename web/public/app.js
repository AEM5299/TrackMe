$("#navbar").load("navbar.html");
$("#footer").load("footer.html");

const currentUser = sessionStorage.getItem('token');
//const API_URL = 'https://aafifi-sit-209-ddszsqyel.now.sh/api';
const API_URL = 'http://localhost:5000/api';
const MQTT_URL = 'https://aafifi-mqtt-sit-209.now.sh';

if (currentUser) {
	$.ajax({
		url: `${API_URL}/devices`,
		type: 'GET',
		headers: {
			'Authorization': `bearer ${sessionStorage.getItem('token')}`
		},
		success: function (res) {
			console.log(res);
			res.data.forEach(device => {
				$('#devices tbody').append(`
					<tr data-device-id=${device._id}>
						<td class="UserCol">${device.user}</td>
						<td class="nameCol">${device.name}</td>
						<td class="mapcol"><i class="fas fa-search-location"></i></td>
					</tr>
				`);
			});
			addDeviceEventHandlers();
		},
		error: function (err) {
			if (err.status == 401) {
				location.href = '/login';
			} else {
				console.error(err);
			}
		}
	});
} else {
	const path = window.location.pathname;
	if(path !== '/login' && path !== '/register') location.href = '/login';
}

function addDeviceEventHandlers() {
	$('#devices tbody tr td .fa-search-location').on('click', e => {
		const deviceid = e.currentTarget.closest('tr').getAttribute('data-device-id');
		$('#mapModal').modal('show');
		$.ajax({
			url: `${API_URL}/devices/${deviceid}/device-history`,
			type: 'GET',
			headers: {
				'Authorization': `bearer ${sessionStorage.getItem('token')}`
			},
			success: function (res) {
				if(!res.data.sensorData.length) {
					console.log('empty');
				} else {
					const LatLng = new google.maps.LatLng(res.data.sensorData[0].loc.lat, res.data.sensorData[0].loc.lon)
					const map = new google.maps.Map(document.getElementById('map_canvas'), {
						center: LatLng,
						zoom: 8
					});
					var marker = new google.maps.Marker({ position: LatLng, map: map, title: res.message.substring(0, res.message.length - 7), label: "A" });
				}
			},
			error: function (err) {
				if (err.status == 401) {
					location.href = '/login';
				} else {
					console.error(err);
				}
			}
		});
	});
	$('#devices tbody tr :not(.mapcol, .fa-search-location)').on('click', e => {
		const deviceId = e.currentTarget.closest("tr").getAttribute('data-device-id');
		$.ajax({
			url: `${API_URL}/devices/${deviceId}/device-history`,
			type: 'GET',
			headers: {
				'Authorization': `bearer ${sessionStorage.getItem('token')}`
			},
			success: function (res) {
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
			},
			error: function (err) {
				if (err.status == 401) {
					location.href = '/login';
				} else {
					console.error(err);
				}
			}
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

	$.ajax({
		url: `${API_URL}/devices`,
		type: 'POST',
		headers: {
			'Authorization': `bearer ${sessionStorage.getItem('token')}`
		},
		data: body,
		success: function (res) {
			location.href = '/';
		},
		error: function (err) {
			if (err.status == 401) {
				location.href = '/login';
			} else {
				console.error(`Error: ${error}`);
			}
		}
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
	$.post(`${API_URL}/register`, { name: username, password: password, isAdmin: false })
		.then(res => {
			if (res.success) {
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
	.then(res => {
		if (res.success) {
			sessionStorage.setItem('token', res.data.token);
			location.href = '/';
		} else {
			$('#message').text(res.message).show();
		}
	});
});

const logout = () => {
	sessionStorage.removeItem('user');
	location.href = "/login";
};