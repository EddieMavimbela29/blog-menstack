require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const path = require("path");
const app = express();
const multer = require("multer");

//Routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');

// Connect to MongoDB
mongoose
    .connect(
        process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    )
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.use("/images", express.static(path.join(__dirname, "/images")));
app.use(express.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, req.body.name);
    },
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
    res.status(200).json("File has been uploaded");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/categories", categoryRoutes);

app.listen('6000', () => {
    console.log('Backend is running!!!')
})