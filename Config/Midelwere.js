const jwt = require('jsonwebtoken');

let authmiddleware = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        console.log('No token found');
        return res.status(401).json({ message: "Unauthorized" });
    }
    console.log("token found:", token.substring(0, 20) + '...');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('User:', { id: decoded.id, role: decoded.role });
        if(['admin', 'advertiser', 'viewer', 'superadmin', 'publisher'].includes(decoded.role)){
            req.user = decoded;
            next();
        } else {
            console.log('Role not authorized:', decoded.role);
            return res.status(403).json({ message: "Forbidden: Invalid role" });
        }
    } catch (error) {
        console.log('Token error:', error.message);
        return res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = authmiddleware;