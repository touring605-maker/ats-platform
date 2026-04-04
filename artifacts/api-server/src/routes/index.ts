import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jobsRouter from "./jobs";
import candidatesRouter from "./candidates";
import applicationsRouter from "./applications";
import organizationsRouter from "./organizations";
import dashboardRouter from "./dashboard";
import careersRouter from "./careers";
import storageRouter from "./storage";
import emailTemplatesRouter from "./emailTemplates";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use("/dashboard", dashboardRouter);
router.use("/jobs", jobsRouter);
router.use("/candidates", candidatesRouter);
router.use("/applications", applicationsRouter);
router.use("/organizations", organizationsRouter);
router.use("/careers", careersRouter);
router.use("/email-templates", emailTemplatesRouter);

export default router;
