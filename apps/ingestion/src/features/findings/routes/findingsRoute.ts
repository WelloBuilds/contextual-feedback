import { Hono } from "hono";
import FindingsController from "../controllers/FindingsController";

const findingsRoute = new Hono();

findingsRoute.get("/", FindingsController.list);
findingsRoute.patch("/:id", FindingsController.update);

export default findingsRoute;
