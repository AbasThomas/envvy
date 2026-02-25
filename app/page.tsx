"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const LANDING_PATH = "/runlyx-landing.html";

function executeScripts(root: HTMLElement) {
  const scripts = Array.from(root.querySelectorAll("script"));
  for (const script of scripts) {
    const replacement = document.createElement("script");
    for (const attr of Array.from(script.attributes)) {
      replacement.setAttribute(attr.name, attr.value);
    }
    replacement.text = script.textContent ?? "";
    script.parentNode?.replaceChild(replacement, script);
  }
}

function updateAnchorLabel(anchor: HTMLAnchorElement, label: string) {
  const textNodes = Array.from(anchor.childNodes).filter(
    (node) => node.nodeType === Node.TEXT_NODE && !!node.textContent?.trim(),
  );

  if (textNodes.length) {
    textNodes[0].textContent = ` ${label} `;
    return;
  }

  const labelledSpan = anchor.querySelector<HTMLSpanElement>('[data-envii-auth-label="true"]');
  if (labelledSpan) {
    labelledSpan.textContent = label;
    return;
  }

  const fallback = document.createElement("span");
  fallback.setAttribute("data-envii-auth-label", "true");
  fallback.textContent = label;
  anchor.prepend(fallback);
}

function applyAuthenticatedCtas(root: HTMLElement) {
  const loginLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href="/login"]'));
  const signupLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href="/signup"]'));

  for (const link of loginLinks) {
    if (link.closest("header")) {
      link.style.display = "none";
      continue;
    }
    link.setAttribute("href", "/dashboard");
    updateAnchorLabel(link, "Dashboard");
  }

  for (const link of signupLinks) {
    link.setAttribute("href", "/dashboard");
    updateAnchorLabel(link, link.closest("header") ? "Dashboard" : "Go to Dashboard");
  }
}

async function loadHeadAssets(doc: Document) {
  const headNodes = doc.head.querySelectorAll(
    'link[rel="preconnect"], link[rel="stylesheet"], style, script[src]',
  );
  for (const node of Array.from(headNodes)) {
    if (node instanceof HTMLScriptElement) {
      const src = node.getAttribute("src");
      if (!src) continue;
      if (document.querySelector(`script[data-runlyx-clone="true"][src="${src}"]`)) continue;
      await new Promise<void>((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.setAttribute("data-runlyx-clone", "true");
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
      continue;
    }

    const signature =
      node instanceof HTMLLinkElement
        ? `${node.tagName}:${node.rel}:${node.href}`
        : `${node.tagName}:${node.getAttribute("id") ?? ""}:${node.textContent ?? ""}`;

    if (document.head.querySelector(`[data-runlyx-signature="${CSS.escape(signature)}"]`)) {
      continue;
    }

    const clone = node.cloneNode(true) as HTMLElement;
    clone.setAttribute("data-runlyx-clone", "true");
    clone.setAttribute("data-runlyx-signature", signature);
    document.head.appendChild(clone);
  }
}

export default function HomePage() {
  const { status } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;

    async function mountClone() {
      const res = await fetch(LANDING_PATH);
      if (!res.ok) {
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<div style="padding:2rem;color:#fff">Unable to load landing template.</div>';
        }
        return;
      }

      const html = await res.text();
      if (disposed || !containerRef.current) return;

      const doc = new DOMParser().parseFromString(html, "text/html");
      if (doc.title) {
        document.title = doc.title;
      }

      await loadHeadAssets(doc);
      if (disposed || !containerRef.current) return;

      containerRef.current.innerHTML = doc.body.innerHTML;
      executeScripts(containerRef.current);
      if (status === "authenticated") {
        applyAuthenticatedCtas(containerRef.current);
      }
    }

    mountClone().catch(() => {
      if (containerRef.current) {
        containerRef.current.innerHTML =
          '<div style="padding:2rem;color:#fff">Unable to render landing clone.</div>';
      }
    });

    return () => {
      disposed = true;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !containerRef.current) return;
    applyAuthenticatedCtas(containerRef.current);
  }, [status]);

  return <div ref={containerRef} className="min-h-screen" suppressHydrationWarning />;
}
