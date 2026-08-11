import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getUsers } from "../controllers/userController.js";

const router = Router();

router.use(protect);
router.get("/", getUsers);

export default router;
