"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";

type Props = {
  keys: string[];
};

const TOKEN_RELATION_REGEX = /(_URL|_HOST|_PORT|_KEY|_SECRET|_TOKEN)$/i;

export function EnvGraph({ keys }: Props) {
  const buckets = keys.reduce<Record<string, string[]>>((acc, key) => {
    const group = TOKEN_RELATION_REGEX.exec(key)?.[0] ?? "GEN";
    if (!acc[group]) acc[group] = [];
    acc[group].push(key);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(buckets).map(([group, list], index) => (
        <motion.div
          key={group}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06 }}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3"
        >
          <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
            {group === "GEN" ? "General" : group.replace("_", "")}
          </p>
          <div className="flex flex-wrap gap-2">
            {list.map((item) => (
              <Badge key={item} variant="muted">
                {item}
              </Badge>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
