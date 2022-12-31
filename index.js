const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Schema } = mongoose;

require("dotenv").config();

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new Schema({
	username: { type: String, required: true }
});

const exerciseSchema = new Schema({
	userId: { type: String, required: true },
	description: { type: String, required: true },
	duration: { type: Number, required: true },
	date: { type: Date, required: true }
});

const User = mongoose.model("User", userSchema, "excercise-users");
const Exercise = mongoose.model("Exercise", exerciseSchema, "exercises");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

function validateParameter(param, predicate, error, res) {
	if (!predicate(param)) {
		errorResponse(res, error, 400);
		return false;
	} else {
		return true;
	}
}

function validateDate(date, error, res) {
	return validateParameter(date, (date) => date instanceof Date && date.toString() !== "Invalid Date", error, res);
}

function validateNumber(number, error, res) {
	return validateParameter(number, (number) => typeof number === "number" && !isNaN(number), error, res);
}

function validateString(string, error, res) {
	return validateParameter(string, (string) => typeof string === "string" && string !== "", error, res);
}

function errorResponse(res, error = "An unknown error occured when processing your request.", status = 500) {
	return res.status(status).json({ error });
}

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
	const username = req.body.username;
	if (!validateString(username, "Invalid Username", res)) return;
	const newUser = new User({ username: username });

	User.findOne({ username }, (err, user) => {
		if (err) return errorResponse(res);
		if (user) return errorResponse(res, "Username already taken", 400);

		return newUser.save((err, data) => {
			if (err) return errorResponse(res);
			return res.json({ username: data.username, _id: data._id });
		});
	});
});

app.get("/api/users", (req, res) => {
	User.find({}, (err, users) => {
		if (err) return errorResponse(res);
		return res.json(users);
	});
});

app.post("/api/users/:userid/exercises", (req, res) => {
	const userid = req.params.userid;
	const description = req.body.description;
	const duration = parseInt(req.body.duration);
	const date = req.body.date ? new Date(req.body.date) : new Date();

	if (!validateString(description, "Invalid Description", res)) return;
	if (!validateNumber(duration, "Invalid Duration", res)) return;
	if (!validateDate(date, "Invalid Date", res)) return;
	if (!validateString(userid, "Invalid UserId", res)) return;

	const newExercise = new Exercise({
		userid: userid,
		description: description,
		duration: duration,
		date: date
	});

	newExercise.save((err, data) => {
		if (err) return errorResponse(res);

		return res.json({
			_id: data.userId,
			username: data.username,
			date: data.date.toDateString(),
			duration: data.duration,
			description: data.description
		});
	});
});

app.get("/api/users/:userid/logs", (req, res) => {
	const userid = req.params.userid;
	const from = req.query.from;
	const to = req.query.to;
	const limit = req.query.limit;

	User.findById(userid, (err, user) => {
		if (err) return errorResponse(res);
		if (!user) return errorResponse(res, "User not found", 404);

		Exercise.find({ userid: userid }, (err, log) => {
			if (err) return errorResponse(res);

			if (from) {
				const fromDate = new Date(from);
				if (!validateDate(fromDate, "Invalid From Date", res)) return;
				log = log.filter((exercise) => exercise.date >= fromDate);
			}

			if (to) {
				const toDate = new Date(to);
				if (!validateDate(toDate, "Invalid To Date", res)) return;
				log = log.filter((exercise) => exercise.date <= toDate);
			}

			if (limit) {
				const logLimit = parseInt(limit);
				if (!validateNumber(logLimit, "Invalid Limit", res)) return;
				log = log.slice(0, parseInt(logLimit));
			}

			return res.json({
				_id: user._id,
				username: user.username,
				count: log.length,
				log: log.map((exercise) => ({
					description: exercise.description,
					duration: exercise.duration,
					date: exercise.date.toDateString()
				}))
			});
		});
	});
});

const listener = app.listen(process.env.PORT, () => console.log("IT'S ALIVE on port " + listener.address().port));