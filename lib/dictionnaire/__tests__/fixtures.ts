// Dictionnaire de test (pas de « .test. » dans le nom : fichier non collecté).
// 42 articles, 5 par page, soit 9 pages dont la dernière n'en a que 2.
// Choisis pour couvrir les cas : accents, homographes, plusieurs sens avec
// phrase de question, articles sans synonyme ni contraire, lettres sans article.
import { paginate } from "../pagination";
import type { Article, DictionaryFile, Gender, Nature, Sense } from "../types";

export const FIXTURE_ARTICLES_PER_PAGE = 5;

interface Extra {
  readonly synonyms?: readonly string[];
  readonly antonyms?: readonly string[];
}

function article(
  headword: string,
  nature: Nature,
  gender: Gender | undefined,
  senses: readonly Sense[],
  extra: Extra = {},
): Article {
  return {
    headword,
    nature,
    ...(gender ? { gender } : {}),
    senses,
    synonyms: extra.synonyms ?? [],
    antonyms: extra.antonyms ?? [],
    source: "dicoado",
  };
}

function sense(definition: string, example?: string, quizExample?: string): Sense {
  return {
    definition,
    ...(example ? { example } : {}),
    ...(quizExample ? { quizExample } : {}),
  };
}

export const FIXTURE_ARTICLES: readonly Article[] = [
  article("abeille", "nom", "féminin", [sense("insecte qui fabrique le miel", "L'abeille butine les fleurs.")]),
  article("aimer", "verbe", undefined, [sense("avoir de l'affection pour quelqu'un", "J'aime ma sœur.")], {
    synonyms: ["adorer", "chérir"],
    antonyms: ["détester"],
  }),
  article("arbre", "nom", "masculin", [sense("grande plante au tronc de bois", "Le chat est monté dans l'arbre.")]),
  article("balle", "nom", "féminin", [sense("petite boule qui rebondit", "Lance-moi la balle !")]),
  article("ballon", "nom", "masculin", [sense("grosse balle gonflée d'air", "Le ballon roule dans le jardin.")]),
  article("banane", "nom", "féminin", [sense("fruit long à la peau jaune", "Je mange une banane au goûter.")]),
  article("bateau", "nom", "masculin", [sense("engin qui flotte et navigue sur l'eau", "Le bateau quitte le port.")], {
    synonyms: ["navire"],
  }),
  article("bavard", "adjectif", undefined, [sense("qui parle beaucoup", "Mon voisin est très bavard.")], {
    synonyms: ["causant"],
    antonyms: ["silencieux", "muet"],
  }),
  article("bleu", "adjectif", undefined, [sense("de la couleur du ciel sans nuage", "Il porte un pull bleu.")]),
  article("chat", "nom", "masculin", [sense("petit animal à moustaches qui miaule", "Le chat dort au soleil.")], {
    synonyms: ["matou"],
  }),
  article("chaton", "nom", "masculin", [sense("petit du chat", "Le chaton joue avec une pelote.")]),
  article("cheval", "nom", "masculin", [sense("grand animal qu'on peut monter", "Le cheval galope dans le pré.")]),
  article("chien", "nom", "masculin", [sense("animal domestique qui aboie", "Le chien garde la maison.")]),
  article("content", "adjectif", undefined, [sense("qui ressent de la joie", "Je suis content de te voir.")], {
    synonyms: ["heureux", "joyeux"],
    antonyms: ["triste", "mécontent"],
  }),
  article("dormir", "verbe", undefined, [sense("être dans le sommeil", "Le bébé dort dans son lit.")], {
    antonyms: ["veiller"],
  }),
  article("doux", "adjectif", undefined, [sense("agréable à toucher", "Le pelage du lapin est doux.")], {
    synonyms: ["moelleux"],
    antonyms: ["rugueux"],
  }),
  article("feuille", "nom", "féminin", [
    sense("partie verte et plate d'une plante", "En automne, les feuilles tombent.", "Une feuille de chêne est tombée dans la flaque."),
    sense("morceau de papier", "Prends une feuille pour dessiner.", "J'écris mon nom en haut de la feuille."),
  ]),
  article("fin", "nom", "féminin", [sense("moment où quelque chose s'arrête", "C'est la fin des vacances.")], {
    synonyms: ["terme"],
    antonyms: ["début", "commencement"],
  }),
  article("fin", "adjectif", undefined, [sense("qui est très mince", "Ce papier est si fin qu'il se déchire.")], {
    antonyms: ["épais"],
  }),
  article("glace", "nom", "féminin", [
    sense("eau devenue solide avec le froid", "Le lac est couvert de glace.", "Les enfants patinent sur la glace du lac."),
    sense("miroir", "Elle se regarde dans la glace.", "Il se coiffe devant la glace de la salle de bains."),
    sense("dessert froid et sucré", "Je voudrais une glace à la fraise.", "En été, nous mangeons une glace au chocolat."),
  ]),
  article("grand", "adjectif", undefined, [sense("dont la taille dépasse la moyenne", "Mon frère est grand.")], {
    synonyms: ["haut"],
    antonyms: ["petit"],
  }),
  article("loup", "nom", "masculin", [sense("animal sauvage qui ressemble à un gros chien", "Le loup hurle la nuit.")]),
  article("lune", "nom", "féminin", [sense("astre qui brille la nuit", "Ce soir, la lune est pleine.")]),
  article("maison", "nom", "féminin", [sense("bâtiment où l'on habite", "Notre maison a un toit rouge.")], {
    synonyms: ["logis", "demeure"],
  }),
  article("manger", "verbe", undefined, [sense("avaler de la nourriture", "J'ai faim, je vais manger.")], {
    synonyms: ["se nourrir"],
    antonyms: ["jeûner"],
  }),
  article("marché", "nom", "masculin", [sense("lieu où l'on vend des fruits, des légumes…", "Nous achetons des pommes au marché.")]),
  article("mer", "nom", "féminin", [sense("grande étendue d'eau salée", "Nous nous baignons dans la mer.")], {
    synonyms: ["océan"],
  }),
  article("moutarde", "nom", "féminin", [sense("sauce jaune au goût piquant", "Papa met de la moutarde sur sa viande.")]),
  article("mouton", "nom", "masculin", [sense("animal couvert de laine", "Le berger garde ses moutons.")]),
  article("moyen", "adjectif", undefined, [sense("qui est entre les deux", "Il est de taille moyenne.")]),
  article("petit", "adjectif", undefined, [sense("dont la taille est au-dessous de la moyenne", "La souris est un petit animal.")], {
    antonyms: ["grand"],
  }),
  article("pomme", "nom", "féminin", [sense("fruit rond du pommier", "Je croque une pomme rouge.")]),
  article("pomme de terre", "nom", "féminin", [sense("légume qui pousse sous la terre", "Les frites sont faites avec des pommes de terre.")], {
    synonyms: ["patate"],
  }),
  article("porte", "nom", "féminin", [sense("ouverture qui permet d'entrer et de sortir", "Ferme la porte, il fait froid !")]),
  article("ranger", "verbe", undefined, [sense("mettre chaque chose à sa place", "Je range mes jouets dans le coffre.")], {
    antonyms: ["déranger"],
  }),
  article("rapide", "adjectif", undefined, [sense("qui va vite", "Le guépard est un animal rapide.")], {
    synonyms: ["vif"],
    antonyms: ["lent"],
  }),
  article("renard", "nom", "masculin", [
    sense("animal sauvage au pelage roux", "Le renard guette les poules.", "Un renard a traversé la route devant la voiture."),
    sense("personne rusée", "Méfie-toi, c'est un vieux renard.", "Ce marchand est un renard, il trompe ses clients."),
  ], { synonyms: ["goupil"] }),
  article("soleil", "nom", "masculin", [sense("astre qui nous éclaire le jour", "Le soleil se lève à l'est.")]),
  article("souris", "nom", "féminin", [
    sense("petit animal gris à longue queue", "La souris grignote le fromage.", "Le chat guette la souris près du trou."),
    sense("appareil qu'on déplace pour guider un ordinateur", "Clique avec la souris.", "Ma souris d'ordinateur n'a plus de pile."),
  ]),
  article("table", "nom", "féminin", [
    sense("meuble sur lequel on mange ou on travaille", "Mets les assiettes sur la table.", "Nous dînons autour de la grande table."),
    sense("liste rangée en colonnes", "Je récite la table de 7.", "La table de 9 est la plus difficile à retenir."),
  ]),
  article("train", "nom", "masculin", [sense("suite de wagons tirés par une locomotive", "Le train entre en gare.")]),
  article("vite", "adverbe", undefined, [sense("à grande vitesse", "Ne cours pas si vite !")], {
    synonyms: ["rapidement"],
    antonyms: ["lentement"],
  }),
];

export const FIXTURE_DICTIONARY: DictionaryFile = {
  version: 1,
  articlesPerPage: FIXTURE_ARTICLES_PER_PAGE,
  pages: paginate(FIXTURE_ARTICLES, FIXTURE_ARTICLES_PER_PAGE),
};
