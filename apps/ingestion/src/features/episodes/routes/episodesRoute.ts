import { Hono } from "hono";
import EpisodesController from "../controllers/EpisodesController";

const episodesRoute = new Hono();

episodesRoute.get("/", EpisodesController.list);

export default episodesRoute;
