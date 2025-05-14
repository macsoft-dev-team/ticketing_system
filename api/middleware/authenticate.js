const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const authenticate = async (req, res, next) => {
  if (req.path === "/auth/login") return next(); // Allow access to /login without token

  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;  
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

module.exports = authenticate;
