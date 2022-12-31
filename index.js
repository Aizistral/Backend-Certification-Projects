let express = require('express');
let app = express();

require('dotenv').config();

let cors = require('cors');
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

app.use(express.static('public'));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/whoami', function (req, res) {
	let ipaddress = req.ip ? req.ip : "Unknown";
	let language = req.headers['accept-language'] ? req.headers['accept-language'] : "Unknown";
	let software = req.headers['user-agent'] ? req.headers['user-agent'] : "Unknown";

	res.json({ ipaddress, language, software });
});

let listener = app.listen(process.env.PORT || 3000, function () {
	console.log('Your app is listening on port ' + listener.address().port);
});
