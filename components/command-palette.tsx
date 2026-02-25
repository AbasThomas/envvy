"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SearchIcon } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { useShortcuts } from "@/hooks/use-shortcuts";

const COMMANDS = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Explore", path: "/explore" },
  { label: "Editor", path: "/editor" },
  { label: "Billing", path: "/billing" },
  { label: "Settings", path: "/settings" },
  { label: "Profile", path: "/profile" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useShortcuts([
    { key: "k", ctrl: true, onTrigger: () => setOpen((v) => !v) },
    { key: "escape", onTrigger: () => setOpen(false) },
  ]);

  const items = useMemo(() => {
    return COMMANDS.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-start bg-[#010705]/70 p-4 pt-20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="mx-auto w-full max-w-xl rounded-2xl border border-[#D4A574]/20 bg-[#02120e]/90 p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#D4A574]/20 bg-[#1B4D3E]/20 px-3">
              <SearchIcon className="h-4 w-4 text-[#a8b3af]" />
              <Input
                placeholder="Jump to..."
                className="border-0 bg-transparent px-0 focus-visible:ring-0"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.path}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-[#c8d2ce] hover:bg-[#1B4D3E]/35"
                  onClick={() => {
                    setOpen(false);
                    router.push(item.path);
                  }}
                >
                  {item.label}
                  <span className="text-xs text-[#6e7d78]">{item.path}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
