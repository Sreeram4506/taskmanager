import { initials } from "../lib/utils";

export default function Avatar({ user, size = 36 }) {
  if (!user) return null;
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white shrink-0 ring-2 ring-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundColor: user.avatarColor || "#6366f1",
      }}
      title={user.name}
    >
      {initials(user.name)}
    </div>
  );
}
