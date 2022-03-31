const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5001

const userRoute = require("./routes/users")

// Middleware
app.use(express.json())
app.use(morgan('tiny'))
app.use(cors())

// ROUTES
app.use("/api", userRoute)


// Listening Port and DB starter
const start = () => {
    try {
        connectDB()
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    } catch (error) {
        console.log(error);
    }
}
start()
