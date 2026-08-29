"use client";

import toast, { Toaster } from "react-hot-toast";

export { Toaster };

export const showToast = {
  success: (message: string) =>
    toast.success(message, {
      style: {
        borderRadius: "10px",
        background: "#f0fdf4",
        color: "#166534",
        border: "1px solid #bbf7d0",
      },
    }),
  error: (message: string) =>
    toast.error(message, {
      style: {
        borderRadius: "10px",
        background: "#fef2f2",
        color: "#991b1b",
        border: "1px solid #fecaca",
      },
    }),
  info: (message: string) =>
    toast(message, {
      icon: "ℹ️",
      style: {
        borderRadius: "10px",
        background: "#eff6ff",
        color: "#1e40af",
        border: "1px solid #bfdbfe",
      },
    }),
  warning: (message: string) =>
    toast(message, {
      icon: "⚠️",
      style: {
        borderRadius: "10px",
        background: "#fffbeb",
        color: "#92400e",
        border: "1px solid #fde68a",
      },
    }),
};
