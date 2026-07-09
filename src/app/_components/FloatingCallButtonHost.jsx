"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

import FloatingCallButton from "@components/FloatingCallButton";

const FloatingCallButtonHost = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || pathname?.startsWith("/admin")) {
    return null;
  }

  return createPortal(<FloatingCallButton />, document.body);
};

export default FloatingCallButtonHost;
