import { onRequest } from "firebase-functions/v2/https";
import express from "express"
import cors from "cors";

// ~ Routes
import adminRoutes from "./router/adminRouter"

const app = express();

// middleware
app.use(express.json());

app.use(cors({
    origin: "*"
}));

// routes
app.use("/admin", adminRoutes);

app.get('/', (req, res) => {
    res.send("alive")
})

// ~ Export
exports.api = onRequest(app);