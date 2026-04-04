import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jobsRouter from "./jobs";
import candidatesRouter from "./candidates";
import applicationsRouter from "./applications";
import organizationsRouter from "./organizations";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/jobs", jobsRouter);
router.use("/candidates", candidatesRouter);
router.use("/applications", applicationsRouter);
router.use("/organizations", organizationsRouter);

export default router;
