const User = require("../models/User");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const {uuidv4} = require('uuid');
const UserOTPVerification = require("../models/UserOTP");
const crypto = require('crypto')


// MAIL SETUP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS
  }
})
// testing success
transporter.verify((error, success) => {
  if(error) console.log(error);
  else {
    console.log("Ready for message");
    console.log(success);
  }
})

const sendVerificationEmail = ({_id, email}, res) => {
  const currentUrl = 'http://localhost:5000/'

  const uniqueString = uuidv4() * _id;

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify your email",
    html: `<p>Verify your email address to complete login and signup into your account. </p><p>This link <b>expires in 6 hours</b></p><p>Press <a href=${currentUrl + "user/verify" + _id + '/' + uniqueString }> Here</a> To proceed. </p>`
  }

  // hash uniqueString
  const saltRound = 10;
  bcrypt
  .hash(uniqueString, saltRound)
  .then(hashUniqueString => {
    // set value to userVerification collection
    const newVerification = new UserOTPVerification({
      userId: _id,
      uniqueString: hashUniqueString,
      createdAt: Date.now(),
      expiresAt: Date.now() + 21600000 // 6hours
    })
    newVerification.save()
    .then(() => {
      transporter.sendMail(mailOptions)
      // sent and verification record saved
      .then(() => {
        res.status(200).json({msg: "Verification Email sent"})
      })
      .catch(err => {
        res.status(500).json({msg: "Verification email failed"})
        console.log(err);
      })
    })
    .catch(err => {
      res.status(500).json({msg: "Could't save verification email data"})
      console.log(err);
    })
  })
  .catch((err) => {
    res.status(500).json({msg: "An error occured while hashing email data"})
    console.log(err);
  })
}


const verifyOTP = async (req, res) => {
   try {
    let {userId, uniqueString} =  req.params;
     const result =  await UserOTPVerification.find({userId})
    //  no verification record
    !result && res.status(404).json({msg: "Account record doesn't exist or has been verfied already, Please sign up or login "})

    // check if record has expired/valid
    const {expiresAt} = result[0] 
    const hashedUniqueString = result[0].uniqueString
    if(expiresAt < Date.now()) {
     const expiredData =  await UserOTPVerification.deleteOne({userId})
     !expiredData && res.status(400).json("An error occured while clearing expired user verification record")
      res.status(401).json("Expired!!!")

      await User.deleteOne({_id: userId})
      res.status(200).json({msg: "Expired Link, Please sign up"})
      res.redirect("/register")
    }

    // comparing hashed string to ensure it hasn't been altered
    const comparedData = bcrypt.compare(uniqueString, hashedUniqueString)

    !comparedData && res.status(401).json({msg: "Invalid verification details passed. Check your inbox"})

    User.findOne({_id: userId}, {verified: true})
    UserOTPVerification.deleteOne({userId})
    res.status(200).json({msg: "Successfully Verified!!!"})

   } catch (error) {
     res.status(500).json({msg: "An error occured while checking for existing user verification record"})
     res.redirect("/")
   }
}

const verified = (req, res) => {
  try {
    
  } catch (error) {
    res.status(500).json(error)
  }
}

// REGISTER
const register = async (req, res) => {
  try {
    const { phone, email, username, password } = req.body;

    const userEmailExists = await User.findOne({ email });
    const userPhoneExists = await User.findOne({ phone });

    userEmailExists && res.status(401).json({ msg: "Email already in use" });
    userPhoneExists &&
      res.status(401).json({ msg: "Phone Number already in use" });

    const user = await User.create(req.body);

    // sending mail
    // sendVerificationEmail(user)

    // check if user is verified
    // !user[0].isVerified && res.status({msg: "Email hasn't been verfied"})

    const token = user.createJWT();
    res.status(200).json({ user, token });


  } catch (error) {
    res.status(500).json(error);
  }
};

// LOGIN
const login = async (req, res) => {
  const {email, password} = req.body;
  try {
    const user = await User.findOne({email})
    !user && res.status(404).json({msg: "Unregistered User"})

    const isPasswordCorrect = await user.comparePassword(password)
    !isPasswordCorrect && res.status(401).json({msg: "Incorrect login credentials"})

    const token = user.createJWT()

    res.status(200).json({user, token})

  } catch (error) {
    res.status(500).json(error);
  }
};

// UPDATE USER
const updateUserr = async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (error) {
        res.status(500).json({ msg: error });
      }
    }
    try {
      await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      res.status(200).json({ msg: "Account has been updated" });
    } catch (error) {
      res.status(500).json({ msg: error });
    }
  } else {
    res.status(403).json({ msg: "You can update only your account" });
  }
};

const updateUser = async (req, res) => {
  const {password } = req.body;

  if (req.body.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(password, salt);
    } catch (error) {
      res.status(500).json({ msg: error });
    }
  }

  const user = await User.findOneAndUpdate({ _id: req.user.userId }, req.body, {
    new: true,
    runValidators: true,
  });

  // const token = user.createJWT()

  res.status(200).json({ user });
};

module.exports = { register, login, updateUser, verifyOTP };
