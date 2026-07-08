"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { track } from "@vercel/analytics";
import ChatDialog from "./ChatDialog";

/** A trigger button that opens the shared FAQ/chat dialog. */
export default function FaqButton({
  className,
  label = "Have a question?",
  startTab = "faq",
}: {
  className?: string;
  label?: ReactNode;
  startTab?: "faq" | "chat";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          if (startTab === "chat") track("chat_opened", { trigger: "button" });
        }}
        className={className}
      >
        {label}
      </button>
      <ChatDialog open={open} onClose={() => setOpen(false)} startTab={startTab} />
    </>
  );
}
