"use client";

import { Fragment } from "react";
import { InlineMath, BlockMath } from "react-katex";

// Découpe un texte mixte (prose + LaTeX) sur les délimiteurs $$...$$ (bloc)
// et $...$ (inline), et rend chaque segment avec le moteur approprié.
// Le LaTeX renvoyé par le modèle peut être invalide (SYNTAX_LATEX_ERROR est une
// classification prévue par le schéma) : on dégrade en texte brut plutôt que de
// laisser react-katex jeter une exception qui ferait planter le rendu.

const SEGMENT_REGEX = /(\$\$[^$]+\$\$|\$[^$]+\$)/g;

interface Segment {
  type: "text" | "inline" | "block";
  content: string;
}

function splitSegments(source: string): Segment[] {
  const parts = source.split(SEGMENT_REGEX).filter((part) => part.length > 0);

  return parts.map((part): Segment => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      return { type: "block", content: part.slice(2, -2) };
    }
    if (part.startsWith("$") && part.endsWith("$")) {
      return { type: "inline", content: part.slice(1, -1) };
    }
    return { type: "text", content: part };
  });
}

export function Latex({ children }: { children: string }) {
  const segments = splitSegments(children);

  return (
    <span className="whitespace-pre-wrap break-words">
      {segments.map((segment, index) => {
        switch (segment.type) {
          case "block":
            return (
              <BlockMath
                key={index}
                math={segment.content}
                renderError={() => (
                  <span className="text-rose-500">{`[LaTeX invalide] ${segment.content}`}</span>
                )}
              />
            );
          case "inline":
            return (
              <InlineMath
                key={index}
                math={segment.content}
                renderError={() => (
                  <span className="text-rose-500">{`[LaTeX invalide] ${segment.content}`}</span>
                )}
              />
            );
          default:
            return <Fragment key={index}>{segment.content}</Fragment>;
        }
      })}
    </span>
  );
}
