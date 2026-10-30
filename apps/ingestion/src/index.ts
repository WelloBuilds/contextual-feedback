import { Hono } from "hono";
import { cors } from "hono/cors";
import ingestionRoutes from "./features/ingestion/routes/ingestionRoute";
import findingsRoute from "./features/insights/routes/findingsRoute";

const app = new Hono();


app.use(
  "*",
  cors({
      origin: "http://localhost:3000",
  })
);

app.route("/ingestion", ingestionRoutes);
app.route("/findings", findingsRoute);


app.notFound((c) => {
  return c.json(
    {
      message: "Route not found",
    },
    404
  );
});

export default app;