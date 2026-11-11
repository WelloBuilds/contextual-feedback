import { Hono } from "hono";
import { cors } from "hono/cors";
import ingestionRoutes from "./features/ingestion/routes/ingestionRoute";
import findingsRoute from "./features/findings/routes/findingsRoute";
import episodesRoute from "./features/episodes/routes/episodesRoute";
import visitorsRoute from "./features/visitors/routes/visitorsRoute";

const app = new Hono();


app.use(
  "*",
  cors({
      origin: "http://localhost:3000",
  })
);

app.route("/ingestion", ingestionRoutes);
app.route("/findings", findingsRoute);
app.route("/episodes", episodesRoute);
app.route("/visitors", visitorsRoute);


app.notFound((c) => {
  return c.json(
    {
      message: "Route not found",
    },
    404
  );
});

export default app;
