const express = require("express");
const cors = require("cors");
const app = express();
const multer = require("multer");

require("dotenv").config();

app.use(cors());
app.use("/public", express.static(process.cwd() + "/public"));
app.use("/api/fileanalyse", multer({ storage: multer.memoryStorage() }).single("upfile"));

app.get("/", (req, res) => res.sendFile(process.cwd() + "/views/index.html"));

app.post("/api/fileanalyse", (req, res) => {
	if (!req.file) return res.status(400).json({ error: "No uploaded file provided." });

	return res.json({
		name: req.file.originalname,
		type: req.file.mimetype,
		size: req.file.size
	});
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("IT'S ALIVE on port " + port));