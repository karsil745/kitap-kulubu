import { useState } from "react";
import type { User } from "../types";
import { figureSrc } from "../lib/figure";

// Bir kullanıcının avatarını gösterir.
// Gerçek profil fotoğrafı varsa (Google) onu, yoksa kullanıcının kendi
// "giydirdiği" figürü (bkz. src/lib/figure.ts) gösterir. `size` piksel
// cinsindendir.
export default function Avatar({
  user,
  size = 32,
}: {
  user: Pick<User, "id" | "photo" | "figure">;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = user.photo && !failed;

  const style = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover" as const,
    flexShrink: 0,
  };

  if (showPhoto) {
    return (
      <img src={user.photo!} alt="" onError={() => setFailed(true)} style={style} />
    );
  }

  return <img src={figureSrc(user.figure, user.id)} alt="" style={style} />;
}
