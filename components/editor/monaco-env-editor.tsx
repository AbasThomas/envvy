"use client";

import Editor from "@monaco-editor/react";
import { useMemo } from "react";
import type { editor } from "monaco-editor";

type Props = {
  value: string;
  onChange: (value: string) => void;
  height?: string;
};

export function MonacoEnvEditor({ value, onChange, height = "420px" }: Props) {
  const options = useMemo<editor.IStandaloneEditorConstructionOptions>(
    () => ({
      minimap: { enabled: false },
      fontSize: 14,
      smoothScrolling: true,
      cursorBlinking: "smooth",
      automaticLayout: true,
      wordWrap: "on",
      lineNumbers: "on",
      bracketPairColorization: { enabled: true },
      renderLineHighlight: "gutter",
      padding: { top: 12, bottom: 12 },
    }),
    [],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D4A574]/20 bg-[#02120e]/60 shadow-[0_24px_48px_-36px_rgba(0,0,0,0.7)]">
      <Editor
        language="shell"
        theme="vs-dark"
        value={value}
        options={options}
        height={height}
        onChange={(nextValue) => onChange(nextValue ?? "")}
      />
    </div>
  );
}
