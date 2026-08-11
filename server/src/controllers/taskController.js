import fs from "fs";
import path from "path";
import Task from "../models/Task.js";
import { uploadDir } from "../middleware/upload.js";

const POPULATE = [
  { path: "assignedTo", select: "name email role avatarColor" },
  { path: "assignedBy", select: "name email role avatarColor" },
  { path: "documents.uploadedBy", select: "name email avatarColor" },
];

// Everyone can see every task assigned to anyone — full team visibility.
export async function getTasks(req, res) {
  try {
    const { status, assignedTo, priority, mine } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (mine === "true") filter.assignedTo = req.user._id;

    const tasks = await Task.find(filter)
      .populate(POPULATE)
      .sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tasks", error: err.message });
  }
}

export async function getTask(req, res) {
  try {
    const task = await Task.findById(req.params.id).populate(POPULATE);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch task", error: err.message });
  }
}

// Any signed-in user can assign a task to any other user.
export async function createTask(req, res) {
  try {
    const { title, description, priority, dueDate, assignedTo } = req.body;
    if (!title || !assignedTo) {
      return res.status(400).json({ message: "Title and assignee are required" });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate: dueDate || undefined,
      assignedTo,
      assignedBy: req.user._id,
    });
    const populated = await task.populate(POPULATE);
    res.status(201).json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to create task", error: err.message });
  }
}

// Editing task details (title/description/priority/dueDate/reassignment)
// is limited to the task creator or an admin.
export async function updateTask(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isOwner = String(task.assignedBy) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the task creator or an admin can edit this task" });
    }

    const { title, description, priority, dueDate, assignedTo } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || undefined;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;

    await task.save();
    const populated = await task.populate(POPULATE);
    res.json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update task", error: err.message });
  }
}

// The core RBAC rule the whole app is built around: nobody but the
// assignee (or an admin, for oversight) may change a task's status —
// and in particular, only the assignee can mark their own task complete.
export async function updateTaskStatus(req, res) {
  try {
    const { status } = req.body;
    if (!["pending", "in-progress", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAssignee = String(task.assignedTo) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isAssignee && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Only the person assigned to this task can update its status" });
    }

    task.status = status;
    task.completedAt = status === "completed" ? new Date() : undefined;
    await task.save();
    const populated = await task.populate(POPULATE);
    res.json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status", error: err.message });
  }
}

export async function deleteTask(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isOwner = String(task.assignedBy) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the task creator or an admin can delete this task" });
    }

    for (const doc of task.documents) {
      const filePath = path.join(uploadDir, doc.storedName);
      fs.promises.unlink(filePath).catch(() => {});
    }
    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete task", error: err.message });
  }
}

// Documents can be pushed by the assignee, the task creator, or an admin.
export async function uploadDocuments(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAssignee = String(task.assignedTo) === String(req.user._id);
    const isOwner = String(task.assignedBy) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isAssignee && !isOwner && !isAdmin) {
      return res.status(403).json({ message: "You do not have access to upload documents to this task" });
    }

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ message: "No files were uploaded" });
    }

    for (const file of files) {
      task.documents.push({
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: req.user._id,
      });
    }
    await task.save();
    const populated = await task.populate(POPULATE);
    res.status(201).json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to upload documents", error: err.message });
  }
}

export async function downloadDocument(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const doc = task.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const filePath = path.join(uploadDir, doc.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File missing on server" });
    }
    res.download(filePath, doc.originalName);
  } catch (err) {
    res.status(500).json({ message: "Failed to download document", error: err.message });
  }
}

export async function deleteDocument(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const doc = task.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const isUploader = String(doc.uploadedBy) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isUploader && !isAdmin) {
      return res.status(403).json({ message: "Only the uploader or an admin can remove this document" });
    }

    const filePath = path.join(uploadDir, doc.storedName);
    fs.promises.unlink(filePath).catch(() => {});
    doc.deleteOne();
    await task.save();
    const populated = await task.populate(POPULATE);
    res.json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete document", error: err.message });
  }
}
