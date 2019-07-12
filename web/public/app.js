$("#navbar").load("navbar.html");
$("#footer").load("footer.html");

const users = JSON.parse(localStorage.getItem('users')) || [];
const response = $.get('http://localhost:3001/devices').then(response => {
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

	$.post('http://localhost:3001/devices', body).then(response => {
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
		$('#message').text('Username already exist.');
		$('#message').show();
	} else {
		if (!(password === confirm)) {
			$('#message').text("Password doesn't match.");
			$('#message').show();
		} else {
			users.push({name: username, password: password});
			localStorage.setItem('users', JSON.stringify(users));
			location.href = '/login';
		}
	}
});

$('#login').on('click', () => {
	const username = $('#username').val();
	const password = $('#password').val();
	const exists = users.find(user => user.name === username);
	if (!exists || !(exists.password === password)) {
		$('#message').text("Wrong credentials");
		$('#message').show();
	} else {
		localStorage.setItem('isAuthenticated', true);
		location.href = '/';
	}
});

const logout = () => {
	localStorage.removeItem('isAuthenticated');
	location.href = "/login";
}