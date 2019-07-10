const devices = [];
devices.push({ user: 'Abood', name: "Abood's iPhone"});
devices.push({ user: 'Ahmed', name: "Ahmed's iPhone"});
devices.push({ user: 'Joey', name: "Joey's iPhone"});

devices.forEach( device => {
	$('#devices tbody').append(`
	<tr>
		<td>${device.user}</td>
		<td>${device.name}</td>
	</tr>`
	)
});