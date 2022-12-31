let express = require('express');
let cors = require('cors');
let app = express();

require('dotenv').config();

app.use(cors({ optionsSuccessStatus: 200 }));  // some legacy browsers choke on 204
app.use(express.static('public'));

app.get("/", function (req, res) {
	res.sendFile(__dirname + '/views/index.html');
});

function isUnixTime(string) {
	return !isNaN(string) && !isNaN(parseInt(string));
}

app.get("/api/:date_string?", function (req, res) {
	let parameter = req.params.date_string;
	let date = parameter ? isUnixTime(parameter) ? new Date(parseInt(parameter)) : new Date(parameter) : new Date();

	if (date.toString() === 'Invalid Date') {
		res.json({ error: 'Invalid Date' });
	} else {
		res.json({ unix: date.getTime(), utc: date.toUTCString() });
	}
});

let listener = app.listen(process.env.PORT, function () {
	console.log('Server is running on port ' + listener.address().port);
});
