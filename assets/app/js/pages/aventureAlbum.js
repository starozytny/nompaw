import React from "react";
import { createRoot } from "react-dom/client";
import { AventureAlbum } from "@appFolder/pages/components/Aventures/AventureAlbum";

const el = document.getElementById("aventure_album");
if (el) {
	createRoot(el).render(<AventureAlbum token={el.dataset.token}
										 randoName={el.dataset.name}
										 unlocked={el.dataset.unlocked === "1"}
										 isMember={el.dataset.isMember === "1"}
										 memberName={el.dataset.memberName || ""}
										 loginUrl={el.dataset.loginUrl || ""} />);
}
