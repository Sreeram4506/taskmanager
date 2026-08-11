import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  uploadDocuments,
  downloadDocument,
  deleteDocument,
} from "../controllers/taskController.js";

const router = Router();

router.use(protect);

router.get("/", getTasks);
router.post("/", createTask);
router.get("/:id", getTask);
router.patch("/:id", updateTask);
router.patch("/:id/status", updateTaskStatus);
router.delete("/:id", deleteTask);

router.post("/:id/documents", upload.array("documents", 5), uploadDocuments);
router.get("/:id/documents/:docId", downloadDocument);
router.delete("/:id/documents/:docId", deleteDocument);

export default router;
