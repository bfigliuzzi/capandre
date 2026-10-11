/** Sources et licence des données (R33). Même contenu que public/dictionnaire/LICENCE.md. */
function ExternalLink({ href, children }: { readonly href: string; readonly children: string }) {
  return (
    <a href={href} className="font-bold text-primary underline underline-offset-4" target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export function DictionaryAbout() {
  return (
    <div className="mx-auto flex max-w-prose flex-col gap-4 text-base">
      <section aria-labelledby="dico-sources" className="flex flex-col gap-2">
        <h2 id="dico-sources" className="font-heading text-xl font-bold">
          D&apos;où viennent les mots ?
        </h2>
        <p>
          Les définitions, les exemples, les synonymes et les contraires viennent de deux dictionnaires libres,
          écrits par des bénévoles : <ExternalLink href="https://fr.dicoado.org">Le Dico des Ados</ExternalLink> et
          le <ExternalLink href="https://fr.wiktionary.org">Wiktionnaire</ExternalLink>, extrait par kaikki.org. Les
          textes sont repris tels quels.
        </p>
        <p>
          Les mots ont été choisis parmi les plus fréquents dans les manuels de l&apos;école élémentaire, grâce à la
          liste Manulex (Lété, Sprenger-Charolles et Colé). Aucune donnée de Manulex ne figure dans le dictionnaire.
        </p>
      </section>
      <section aria-labelledby="dico-licence" className="flex flex-col gap-2">
        <h2 id="dico-licence" className="font-heading text-xl font-bold">
          Licence
        </h2>
        <p>
          Le contenu du dictionnaire est diffusé sous licence{" "}
          <ExternalLink href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr">
            Creative Commons CC BY-SA 4.0
          </ExternalLink>
          . On peut le copier et le modifier, en citant les sources et en gardant la même licence.
        </p>
      </section>
    </div>
  );
}
