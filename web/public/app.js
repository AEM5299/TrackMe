$("#navbar").load("navbar.html");
$("#footer").load("footer.html");

const users = JSON.parse(localStorage.getItem('users')) || [];
const devices = JSON.parse(localStorage.getItem('devices')) || [];

devices.forEach( device => {
	$('#devices tbody').append(`
	<tr>
		<td>${device.user}</td>
		<td>${device.name}</td>
	</tr>`
	)
});

$('#add-device').on('click', () => {
	const user = $("#user").val();
	const name = $("#name").val();
	devices.push({user, name});
	localStorage.setItem('devices', JSON.stringify(devices));
	location.href = "/";
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