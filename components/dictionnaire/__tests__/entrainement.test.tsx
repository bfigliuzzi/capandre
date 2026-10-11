import { screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SkillPicker } from "@/components/dictionnaire/skill-picker";
import { TrainingSession } from "@/components/dictionnaire/training-session";
import { getDB } from "@/lib/db/database";
import { seededRng } from "@/lib/multiplication/__tests__/test-rng";
import { FIXTURE_DICTIONARY } from "@/lib/dictionnaire/__tests__/fixtures";
import { createTraining, SKILLS, type Question, type Skill } from "@/lib/dictionnaire";
import { renderApp, seedDictionary } from "@/test/render-app";

const SEED = 11;

function startSession(skills: readonly Skill[] = SKILLS, seed = SEED) {
  return renderApp(<TrainingSession dictionary={FIXTURE_DICTIONARY} skills={skills} rng={seededRng(seed)} />);
}

/** Les questions que la session va poser : même dictionnaire, mêmes compétences, même graine. */
function expectedQuestions(skills: readonly Skill[] = SKILLS, seed = SEED): Question[] {
  return createTraining(FIXTURE_DICTIONARY, skills, seededRng(seed));
}

async function goToPage(user: UserEvent, page: number) {
  const field = screen.getByLabelText("Aller à la page");
  await user.clear(field);
  await user.type(field, String(page));
  await user.click(screen.getByRole("button", { name: "Aller" }));
}

async function findArticle(user: UserEvent, question: Extract<Question, { headword: string }>) {
  await goToPage(user, question.target.page);
  await user.click(screen.getByRole("button", { name: question.headword }));
}

async function orderWords(user: UserEvent, solution: readonly string[]) {
  for (const [target, word] of solution.entries()) {
    const items = () => within(screen.getByRole("list", { name: "Mots à ranger" })).getAllByRole("listitem");
    let position = items().findIndex((li) => within(li).queryByText(word, { exact: true }));
    while (position > target) {
      await user.click(screen.getByRole("button", { name: `Monter ${word}` }));
      position -= 1;
    }
  }
  await user.click(screen.getByRole("button", { name: "Valider" }));
}

async function choose(user: UserEvent, question: Extract<Question, { choices: readonly string[] }>) {
  const group = screen.getByRole("radiogroup");
  await user.click(within(group).getByRole("radio", { name: question.choices[question.answerIndex] }));
  await user.click(screen.getByRole("button", { name: "Valider" }));
}

async function answerCorrectly(user: UserEvent, question: Question) {
  if (question.skill === "ranger") return orderWords(user, question.solution);
  if ("headword" in question) await findArticle(user, question);
  if ("choices" in question) await choose(user, question);
}

async function next(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: /Question suivante|Voir le résultat/ }));
}

describe("choix des compétences (R14)", () => {
  it("coche toutes les compétences par défaut et commence avec la sélection", async () => {
    const onStart = vi.fn();
    const { user } = renderApp(<SkillPicker onStart={onStart} />);

    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(6);
    boxes.forEach((box) => expect(box).toBeChecked());

    await user.click(screen.getByRole("checkbox", { name: "Chercher un mot" }));
    await user.click(screen.getByRole("button", { name: "Commencer" }));
    expect(onStart).toHaveBeenCalledWith(SKILLS.filter((s) => s !== "chercher"));
  });

  it("demande au moins une compétence pour commencer", async () => {
    const onStart = vi.fn();
    const { user } = renderApp(<SkillPicker onStart={onStart} />);

    for (const box of screen.getAllByRole("checkbox")) await user.click(box);
    await user.click(screen.getByRole("button", { name: "Commencer" }));
    expect(onStart).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Coche au moins une compétence.");
  });
});

describe("un entraînement de bout en bout (R15–R25)", () => {
  it("pose 10 questions, une au moins par compétence, corrige chacune, et donne 3 étoiles pour 10 sur 10", async () => {
    const questions = expectedQuestions();
    expect(new Set(questions.map((q) => q.skill))).toEqual(new Set(SKILLS));
    const { user } = startSession();

    for (const [i, question] of questions.entries()) {
      expect(screen.getByRole("heading", { level: 2, name: `Question ${i + 1} sur 10` })).toBeInTheDocument();
      await answerCorrectly(user, question);
      expect(screen.getByRole("status", { name: "Correction" })).toHaveTextContent("Bonne réponse !");
      await next(user);
    }

    expect(screen.getByText("10 bonnes réponses sur 10")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "3 étoiles sur 3" })).toBeInTheDocument();
  });

  it("chercher : ouvre sur la couverture, compte les pages tournées et invite à continuer après un mauvais article", async () => {
    const [question] = expectedQuestions(["chercher"]);
    if (question.skill !== "chercher") throw new Error("question inattendue");
    const { user } = startSession(["chercher"]);

    expect(screen.getByRole("region", { name: "Couverture du dictionnaire" })).toBeInTheDocument();
    expect(screen.getByText(`Trouve « ${question.headword} » dans le dictionnaire.`)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Page suivante" }));
    await user.click(screen.getByRole("button", { name: "Page suivante" }));
    expect(screen.getByText("Pages tournées : 2")).toBeInTheDocument();

    const wrong = FIXTURE_DICTIONARY.pages[1].articles.find((a) => a.headword !== question.headword)!;
    await user.click(screen.getByRole("button", { name: wrong.headword }));
    expect(screen.getByRole("status", { name: "Indice" })).toHaveTextContent(
      `Ce n'est pas « ${question.headword} », continue à chercher.`,
    );
  });

  it("« Je n'y arrive pas » compte la question fausse et montre le bon article sur sa page (R24)", async () => {
    const [question] = expectedQuestions(["chercher"]);
    if (question.skill !== "chercher") throw new Error("question inattendue");
    const { user } = startSession(["chercher"]);

    await user.click(screen.getByRole("button", { name: "Je n'y arrive pas" }));

    expect(screen.getByRole("status", { name: "Correction" })).toHaveTextContent(
      `Le mot « ${question.headword} » était à la page ${question.target.page}.`,
    );
    const page = screen.getByRole("region", { name: new RegExp(`^Page ${question.target.page},`) });
    expect(within(page).getByRole("article", { name: question.headword })).toHaveClass("ring-2");
  });

  it("une mauvaise réponse affiche la bonne, et le score en tient compte", async () => {
    const [question] = expectedQuestions(["lire-page"]);
    if (question.skill !== "lire-page") throw new Error("question inattendue");
    const { user } = startSession(["lire-page"]);

    const wrongIndex = (question.answerIndex + 1) % question.choices.length;
    await user.click(screen.getByRole("radio", { name: question.choices[wrongIndex] }));
    await user.click(screen.getByRole("button", { name: "Valider" }));

    expect(screen.getByRole("status", { name: "Correction" })).toHaveTextContent(
      `La bonne réponse était : ${question.choices[question.answerIndex]}.`,
    );
  });

  it("ranger : les mots se déplacent au clavier et chaque déplacement est annoncé", async () => {
    const [question] = expectedQuestions(["ranger"]);
    if (question.skill !== "ranger") throw new Error("question inattendue");
    const { user } = startSession(["ranger"]);

    const word = question.shuffled[1];
    screen.getByRole("button", { name: `Monter ${word}` }).focus();
    await user.keyboard("{Enter}");

    const items = within(screen.getByRole("list", { name: "Mots à ranger" })).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent(word);
    expect(screen.getByRole("status", { name: "Position" })).toHaveTextContent(
      `${word} en position 1 sur ${question.shuffled.length}`,
    );
  });

  it("n'enregistre rien en base à la fin (R26)", async () => {
    await seedDictionary();
    const db = await getDB();
    const counts = async () => Promise.all([...db.objectStoreNames].map((name) => db.count(name)));
    const before = await counts();
    const { user } = startSession(["chercher"]);

    for (let i = 0; i < 10; i++) {
      await user.click(screen.getByRole("button", { name: "Je n'y arrive pas" }));
      await next(user);
    }

    expect(screen.getByText("0 bonne réponse sur 10")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "0 étoile sur 3" })).toBeInTheDocument();
    expect(await counts()).toEqual(before);
  });
});
