"use client";

import { useEffect, useState } from "react";
import FaqButton from "./FaqButton";
import { getVariant } from "@/lib/ab";

const COPY = {
  control: "💬 Have a question? Chat with us",
  urgent: "💬 Chat to find your room",
} as const;

/**
 * A/B tests the mobile sticky chat CTA copy (the majority of our traffic is
 * mobile via Facebook shares, so this is the one thing nearly every visitor
 * sees). Both variants open the same chat — we still want people asking
 * questions here instead of going back to Facebook Messenger.
 */
export default function StickyChatBar() {
  const [variant, setVariant] = useState<keyof typeof COPY>("control");
  const [startTab, setStartTab] = useState<"chat" | "faq">("chat");

  useEffect(() => {
    setVariant(getVariant("mobile_cta", ["control", "urgent"]) as keyof typeof COPY);
    setStartTab(getVariant("start_tab", ["chat", "faq"]) as "chat" | "faq");
  }, []);

  return <FaqButton className="btn-book chat-attn w-full" label={COPY[variant]} startTab={startTab} />;
}
