// const jwt = require("jsonwebtoken")

// const verify = (req, res, next) => {
//     const authHeader = req.headers.token

//     if(authHeader) {
//         const token = authHeader.split(" ")[1]
//         jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//             if(err) {
//                 res.status(401).json({msg: "Invalid Token"})
//             }
//             req.user = user;
//             next()
//         })
//     } else {
//         res.status(403).json({msg: "You're not authenticated"})
//     }
// }

// module.exports = verify;

const jwt = require("jsonwebtoken")

const verify = async (req, res, next) => {
  const authHeader = req.headers.token
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    res.status(401).json({msg: 'Authentication Invalid'})
  }
  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { userId: payload.userId }

    next()
  } catch (error) {
    res.status(401).json({msg: 'Authentication Invalid'})
  }
}

module.exports = verify;
