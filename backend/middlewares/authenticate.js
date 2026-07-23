import jwt from 'jsonwebtoken';
import moment from 'moment-timezone';
import User from '../models/user.model.js';
// import User from '../models/User.model.js';

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers["authorization"];

        if (!token) {
            return res
                .status(401)
                .json({ message: "Unauthorized: No token provided" });
        }

        // Check token format
        if (!/^Bearer\s/.test(token)) {
            console.error("Invalid token format");
            return res
                .status(401)
                .json({ message: "Unauthorized: Invalid token format" });
        }

        // Extract the token string
        const tokenString = token.split(" ")[1];

        jwt.verify(tokenString, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                console.error("JWT verification error:", err.message);
                return res
                    .status(401)
                    .json({ message: "Unauthorized: Invalid token" });
            }

            // Convert expiration time to Asia/Kolkata timezone
            const expirationTimeUTC = decoded.exp * 1000; // Convert seconds to milliseconds
            const expirationTimeKolkata = moment(expirationTimeUTC)
                .tz("Asia/Kolkata")
                .unix();

            // Get current time in Asia/Kolkata timezone
            const currentTimeKolkata = moment().tz("Asia/Kolkata").unix();

            // Check if token is expired
            if (expirationTimeKolkata <= currentTimeKolkata) {
                return res
                    .status(401)
                    .json({ message: "Unauthorized: Token expired" });
            }

            // Check if the user exists in the database
            const user = await User.findByPk(decoded.id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            req.authUser = user;
            next();
        });
    } catch (error) {
        console.error("Error in verifyToken:", error);
        return res.status(401).json({ message: "Invalid token" });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.authUser || !roles.includes(req.authUser.role)) {
            return res.status(403).json({
                message: "You do not have permission to perform this action",
            });
        }
        next();
    };
};

export { verifyToken, authorize };