$("#navbar").load("navbar.html");
$("#footer").load("footer.html");

const currentUser = localStorage.getItem('user');
const API_URL = 'http://localhost:5000/api';
if(currentUser) {
	$.get(`${API_URL}/users/${currentUser}/devices`)
	.then(res => {
		res.forEach( device => {
			$('#devices tbody').append(`
			<tr data-device-id=${device._id}>
				<td>${device.user}</td>
				<td>${device.name}</td>
			</tr>
			`);
		});
		$('#devices tbody tr').on('click', e => {
			const deviceId = e.currentTarget.getAttribute('data-device-id');
			$.get(`${API_URL}/devices/${deviceId}/device-history`)
			.then(res => {
				res.map(sensorData => {
					$('#historyContent').empty().append(`
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
	})
	.catch(err => {
		console.error(`Error: ${err}`);
	});
} else {
	const path = window.location.pathname;
	if(path !== '/login' && path !== '/register') location.href = '/login';
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
		console.log(`Error: ${error}`);
	});
});

$('#send-command').on('click', () => {
	const command = $('#command').val();
	console.log(`command is: ${command}`);
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
			console.log(res)
			if(res.success) {
				location.href = '/login';
			} else {
				$('#message').text(res).show();
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
			localStorage.setItem('isAdmin', res.isAdmin);
			location.href = '/';
		} else {
			$('#message').text(res).show();
		}
	});
});

const logout = () => {
	localStorage.removeItem('user');
	localStorage.removeItem('isAdmin');
	location.href = "/login";
}