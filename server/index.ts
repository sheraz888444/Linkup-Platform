import express, { type Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectToDatabase } from "./mongodb";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded media files statically
app.use("/uploads", express.static("uploads"));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// Wrap server setup in async IIFE
(async () => {
  // Connect to MongoDB
  try {
    await connectToDatabase();
    log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
  
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  // Setup Vite in development, static serving in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Set port and host
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = "127.0.0.1";

  // Start server
  server.listen({ port, host }, (err?: Error) => {
    if (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
    log(`🚀 Server running at http://${host}:${port}`);
    log("connected to mongodb ")
  });
})();
