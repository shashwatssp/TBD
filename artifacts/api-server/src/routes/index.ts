import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import eventsRouter from "./events";
import functionsRouter from "./functions";
import tasksRouter from "./tasks";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(eventsRouter);
router.use(functionsRouter);
router.use(tasksRouter);
router.use(notificationsRouter);

export default router;
