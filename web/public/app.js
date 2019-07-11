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
	location.href = "/"
});

$('#send-command').on('click', () => {
	const command = $('#command').val();
	console.log(`command is: ${command}`);
});