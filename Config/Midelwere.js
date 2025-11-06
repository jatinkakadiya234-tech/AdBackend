const jwt = require('jsonwebtoken');

let authmiddleware = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(decoded.role === 'admin' || decoded.role === "advertiser"){
            req.user = decoded;
            next();
        } else {
            return res.status(403).json({ message: "Forbidden: Admins only" });
        }
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = authmiddleware;