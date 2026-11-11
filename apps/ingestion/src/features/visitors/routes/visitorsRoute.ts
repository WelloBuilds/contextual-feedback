import { Hono } from "hono";
import VisitorsController from "../controllers/VisitorsController";

const visitorsRoute = new Hono();

visitorsRoute.get("/", VisitorsController.list);
visitorsRoute.get("/:id", VisitorsController.show);
visitorsRoute.post("/", VisitorsController.create);
visitorsRoute.patch("/:id", VisitorsController.upsert);

export default visitorsRoute;
