const { register, login, updateUser, verifyOTP } = require('../controllers/authController');
const router = require('express').Router()
const {validFields, validLoginFields} = require("../config/validFields")

const rateLimiter = require("express-rate-limit");
const verify  = require('../config/verifyToken');

const apiLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    msg: "Too many requests from this IP, please try again after 15 minutes"
})

router.post("/register", validFields, register)
router.post("/login", validLoginFields, login)
router.patch("/update/:id", verify, updateUser)
router.get("/verify/:userId:/uniqueString", verifyOTP)

module.exports = router;