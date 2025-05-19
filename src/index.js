import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({ path: "./env" });

connectDB()
    .then(() => {
        const server = app.listen(process.env.PORT || 8000, () =>
            console.log(`Server is running at PORT: ${process.env.PORT}`)
        );
        // if any issue in server
        server.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error;
        });
    })
    // if any issue in DB
    .catch((err) => console.log("MongoDB connection failed !!! ", err));
