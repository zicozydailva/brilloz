const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide username'],
    minlength: 3,
    maxlength: 20,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email',
    },
    unique: true,
  },
  emailToken: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please provide Password'],
    minlength: 6,
  },
  phone: {
    type: Number,
    trim: true,
    minlength: 7,
    maxlength: 20,
    default: 'lastName',
    required: [true, "Please provide Phone Number"],
    unique: true
  },
  profilePics: {
    type: String,
    default: "https://media.istockphoto.com/vectors/male-profile-picture-vector-id820317434?k=20&m=820317434&s=612x612&w=0&h=tHWaXrUlOv0L9wWAB4u1feKgjwopSkA267m9tJLiRsw="
  },
  hobbies: {
      type: Array,
      // enum: ["Football", "Basketball", "Ice Hockey", "Motorsports", "Bandy", "Rugby", "Skiing", "Shooting" ]
  }
})

UserSchema.pre('save', async function () {
  // console.log(this.modifiedPaths())
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

UserSchema.methods.createJWT = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  })
}

UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password)
  return isMatch;
}

module.exports = mongoose.model('User', UserSchema)
