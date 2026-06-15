const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");

    // Check if no token
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    // Check token format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token format is invalid" });
    }

    // Get token without Bearer prefix
    const token = authHeader.split(" ")[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Ensure decoded token contains userId
      if (!decoded.userId) {
        return res.status(401).json({ message: "Invalid token structure" });
      }

      // Add user from payload
      req.user = {
        userId: decoded.userId,
        email: decoded.email
      };
      next();
    } catch (err) {
      console.error("Token verification error:", err);
      res.status(401).json({ message: "Token is not valid" });
    }
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
