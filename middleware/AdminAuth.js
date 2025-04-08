const jwt = require("jsonwebtoken");

const AdminAuth = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) return res.status(400).json({ message: "No token found" });

    jwt.verify(token, process.env.JWT_TOKEN_SECRET, (err, decoded) => {
        if (err) return res.status(400).json({ message: "Invalid Token" });
        req.adminId = decoded.admin_id;
        next();
    });
};

module.exports = AdminAuth;