import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import session from "express-session";
import sequelize from "./config/database.js"; // Import the configured Sequelize instance

// Import models


dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
	session({
		secret: process.env.SESSION_SECRET || "your-secret-key",
		resave: false,
		saveUninitialized: true,
		cookie: { secure: false },
	})
);


// ####### Sync model ########
// (async () => {
//     try {
//         // Drop tables in correct order
//         await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

//         await sequelize.sync({ alter: true });

//         await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

//         console.log('All models were synchronized successfully.');
//     } catch (error) {
//         console.error('Error synchronizing models:', error.message);
//         // console.error(error);  // Log the complete error object
//     }
// })();

//middlewares

app.get('/', (req, res) => {
	res.send('Server is running');
});

// Start Server
const PORT = process.env.PORT;

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
