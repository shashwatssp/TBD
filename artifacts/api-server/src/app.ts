import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url}`);
  console.log(`[Server] Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`[Server] Body:`, JSON.stringify(req.body, null, 2));
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
