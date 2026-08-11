import User from "../models/User.js";

export async function getUsers(req, res) {
  try {
    const users = await User.find().select(
      "name email role avatarColor createdAt"
    );
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
}
