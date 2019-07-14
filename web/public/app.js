$("#navbar").load("navbar.html");
$("#footer").load("footer.html");

const API_URL = 'http://localhost:5000/api';
const users = JSON.parse(localStorage.getItem('users')) || [];
const response = $.get(`${API_URL}/devices`).then(response => {
	response.forEach( device => {
		$('#devices tbody').append(`
		<tr>
			<td>${device.user}</td>
			<td>${device.name}</td>
		</tr>`
		)
	});
})
.catch(error => {
	console.log(`Error: ${error}`);
});

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
	const exists = users.find(user => user.name === username);
	if (exists) {
		$('#message').text('Username already exist').show();
	} else {
		if (!(password === confirm)) {
			$('#message').text("Password doesn't match").show();
		} else {
			$.post(`${API_URL}/register`, {username, password})
			.then( res => {
				if(res.success) {
					location.href = '/login';
				} else {
					$('#message').text(res).show();
				}
			});
		}
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