const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const app = express();

require('dotenv').config();

// Basic Configuration
const port = process.env.PORT || 3000;
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new Schema({
	original_url: String,
	short_url: Number
});

const UrlModel = mongoose.model('URL', urlSchema, 'short-urls');

const countURLs = (done) => {
	UrlModel.countDocuments({}, (err, count) => {
		if (err)
			return done(err);
		else
			return done(null, count);
	});
};

const createShortURL = (url, done) => {
	countURLs((err, count) => {
		if (err)
			return done(err);

		let shortURL = new UrlModel({ original_url: url, short_url: count + 1 });

		shortURL.save((err, data) => {
			if (err)
				return done(err);
			else
				return done(null, data);
		});
	});
};

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => res.sendFile(process.cwd() + '/views/index.html'));

function validateURL(url) {
	try {
		new URL(url);
		return true;
	} catch (err) {
		return false;
	}
}

app.post('/api/shorturl', (req, res) => {
	const url = req.body.url;

	if (!validateURL(url)) {
		return res.status(400).json({ error: 'invalid url' });
	} else {
		dns.lookup(new URL(url).hostname, err => {
			if (err)
				return res.status(400).json({ error: 'invalid url' });
		});

		createShortURL(url, (err, data) => {
			if (err)
				return res.status(500).json({ error: 'internal error' });
			else
				return res.json({ original_url: data.original_url, short_url: data.short_url });
		});
	}
});

app.get('/api/shorturl/:shorturl', (req, res) => {
	const shortURL = req.params.shorturl;

	UrlModel.findOne({ short_url: shortURL }, (err, data) => {
		if (err)
			return res.status(500).json({ error: 'internal error' });

		if (data)
			return res.redirect(data.original_url);
		else
			return res.status(404).json({ error: 'invalid url' });
	});
});

app.listen(port, () => console.log(`Listening on port ${port}`));
