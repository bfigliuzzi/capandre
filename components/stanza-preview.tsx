"use client";

interface StanzaPreviewProps {
  stanzas: { verses: string[] }[];
}

export function StanzaPreview({ stanzas }: StanzaPreviewProps) {
  if (stanzas.length === 0) {
    return (
      <p className="text-base text-muted-foreground italic">
        Les strophes apparaîtront ici au fur et à mesure de la saisie...
      </p>
    );
  }

  const totalVerses = stanzas.reduce((sum, s) => sum + s.verses.length, 0);

  return (
    <div className="flex flex-col gap-3">
      {stanzas.map((stanza, i) => (
        <div key={i} className="border-l-3 border-secondary/50 pl-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase mb-1">
            Strophe {i + 1} ({stanza.verses.length} vers)
          </p>
          {stanza.verses.map((verse, j) => (
            <p key={j} className="text-base">{verse}</p>
          ))}
        </div>
      ))}
      <p className="text-sm text-muted-foreground">
        {stanzas.length} strophe{stanzas.length > 1 ? "s" : ""}, {totalVerses} vers au total
      </p>
    </div>
  );
}
