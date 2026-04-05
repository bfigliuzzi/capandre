"use client";

interface StanzaPreviewProps {
  stanzas: { verses: string[] }[];
}

export function StanzaPreview({ stanzas }: StanzaPreviewProps) {
  if (stanzas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Les strophes apparaitront ici au fur et a mesure de la saisie...
      </p>
    );
  }

  const totalVerses = stanzas.reduce((sum, s) => sum + s.verses.length, 0);

  return (
    <div className="flex flex-col gap-3">
      {stanzas.map((stanza, i) => (
        <div key={i} className="border-l-3 border-secondary/50 pl-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
            Strophe {i + 1} ({stanza.verses.length} vers)
          </p>
          {stanza.verses.map((verse, j) => (
            <p key={j} className="text-sm">{verse}</p>
          ))}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        {stanzas.length} strophe{stanzas.length > 1 ? "s" : ""}, {totalVerses} vers au total
      </p>
    </div>
  );
}
