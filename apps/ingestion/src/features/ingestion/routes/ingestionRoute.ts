import { Hono } from "hono";
import IngestionController from "../controllers/ingestionController";

const ingestionRoutes = new Hono();

ingestionRoutes.post("/events", IngestionController.upload);

export default ingestionRoutes;