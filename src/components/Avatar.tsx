import { useState } from "react";
import type { User } from "../types";

// Bir kullanıcının avatarını gösterir.
// Gerçek profil fotoğrafı varsa (Google) onu, yoksa emoji avatarı yuvarlak
// bir zemin üzerinde gösterir. `size` piksel cinsindendir.
export default function Avatar({
  user,
  size = 32,
}: {
  user: Pick<User, "avatar" | "photo">;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = user.photo && !failed;

  if (showPhoto) {
    return (
      <img
        src={user.photo!}
        alt=""
        onError={() => setFailed(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--accent-soft)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.55,
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {user.avatar}
    </span>
  );
}
