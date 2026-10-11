"use client";

import { CircleCheck, CircleX } from "lucide-react";
import { useEffect, useReducer, useRef, useState, type Dispatch } from "react";
import { Button } from "@/components/ui/button";
import {
  createTraining,
  currentQuestion,
  initTrainingUiState,
  trainingScore,
  trainingUiReducer,
  type DictionaryFile,
  type Question,
  type Rng,
  type Skill,
  type TrainingAction,
  type TrainingUiState,
} from "@/lib/dictionnaire";
import { ArticleView } from "./article-view";
import { ChoiceQuestion } from "./choice-question";
import { DictionaryBook } from "./dictionary-book";
import { DictionaryPageView } from "./dictionary-page-view";
import { OrderWords } from "./order-words";
import { TrainingSummary } from "./training-summary";

interface TrainingSessionProps {
  readonly dictionary: DictionaryFile;
  readonly skills: readonly Skill[];
  readonly rng: Rng;
}

interface StepProps {
  readonly dictionary: DictionaryFile;
  readonly state: TrainingUiState;
  readonly question: Question;
  readonly dispatch: Dispatch<TrainingAction>;
}

function SearchStep({ dictionary, state, question, dispatch }: StepProps) {
  if (!("headword" in question)) return null;
  return (
    <div className="flex flex-col gap-4">
      <p className="font-heading text-lg font-bold">Trouve « {question.headword} » dans le dictionnaire.</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base text-muted-foreground">Pages tournées : {state.pagesTurned}</p>
        <Button variant="ghost" onClick={() => dispatch({ type: "abandonner" })}>
          Je n&apos;y arrive pas
        </Button>
      </div>
      <DictionaryBook
        dictionary={dictionary}
        page={state.page}
        onPageChange={(page) => dispatch({ type: "tourner", page })}
        onSelectArticle={(headword) => dispatch({ type: "toucher-article", headword })}
      />
    </div>
  );
}

/** Ce que l'enfant regarde pour répondre : la page, ou l'article trouvé. */
function AnswerContext({ dictionary, question }: Pick<StepProps, "dictionary" | "question">) {
  if (question.skill === "lire-page") return <DictionaryPageView page={dictionary.pages[question.page - 1]} />;
  if (!("target" in question)) return null;
  const article = dictionary.pages[question.target.page - 1].articles[question.target.index];
  return (
    <div className="flex flex-col gap-4">
      <ArticleView article={article} />
      {question.skill === "sens-contexte" && (
        <blockquote className="rounded-xl border-l-4 border-primary bg-muted px-4 py-3 text-lg italic">{question.sentence}</blockquote>
      )}
    </div>
  );
}

function AnswerStep({ dictionary, state, question, dispatch }: StepProps) {
  const submit = () => dispatch({ type: "valider" });
  if (question.skill === "ranger") {
    return <OrderWords words={state.order} onMove={(from, to) => dispatch({ type: "deplacer", from, to })} onSubmit={submit} />;
  }
  if (!("choices" in question)) return null;
  return (
    <div className="flex flex-col gap-6">
      <AnswerContext dictionary={dictionary} question={question} />
      <ChoiceQuestion
        prompt={question.prompt}
        choices={question.choices}
        selected={state.selected}
        onSelect={(index) => dispatch({ type: "choisir", index })}
        onSubmit={submit}
      />
    </div>
  );
}

function CorrectionStep({ dictionary, state, question, dispatch }: StepProps) {
  const last = state.index + 1 >= state.questions.length;
  return (
    <div className="flex flex-col gap-4">
      {question.skill === "chercher" && (
        <DictionaryPageView page={dictionary.pages[question.target.page - 1]} highlight={question.target} />
      )}
      <Button onClick={() => dispatch({ type: "suivant" })} className="self-start">
        {last ? "Voir le résultat" : "Question suivante"}
      </Button>
    </div>
  );
}

function Correction({ state }: { readonly state: TrainingUiState }) {
  const outcome = state.phase === "correction" ? state.outcome : null;
  const Icon = outcome?.correct ? CircleCheck : CircleX;
  return (
    <div role="status" aria-label="Correction" className="empty:hidden">
      {outcome && (
        <p className="flex items-center gap-2 rounded-xl border-2 border-border p-4 text-lg font-bold">
          <Icon aria-hidden="true" className={outcome.correct ? "size-6 text-success" : "size-6 text-destructive"} />
          {outcome.message}
        </p>
      )}
    </div>
  );
}

function TrainingRun({ dictionary, skills, rng, onRestart }: TrainingSessionProps & { readonly onRestart: () => void }) {
  const [state, dispatch] = useReducer(trainingUiReducer, undefined, () =>
    initTrainingUiState(createTraining(dictionary, skills, rng)),
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), [state.index]);

  const question = currentQuestion(state);
  if (state.phase === "fin" || !question) {
    return <TrainingSummary score={trainingScore(state)} total={state.questions.length} onRestart={onRestart} />;
  }
  const step = { dictionary, state, question, dispatch };
  return (
    <section aria-labelledby="dico-question" className="flex flex-col gap-4">
      <h2 id="dico-question" ref={headingRef} tabIndex={-1} className="font-heading text-xl font-bold focus-visible:outline-none">
        Question {state.index + 1} sur {state.questions.length}
      </h2>
      <p role="status" aria-label="Indice" className="text-base">
        {state.phase === "chercher" ? state.hint : ""}
      </p>
      {state.phase === "chercher" && <SearchStep {...step} />}
      {state.phase === "repondre" && <AnswerStep {...step} />}
      <Correction state={state} />
      {state.phase === "correction" && <CorrectionStep {...step} />}
    </section>
  );
}

/** Les 10 questions puis le résumé. « Recommencer » tire de nouvelles questions. */
export function TrainingSession(props: TrainingSessionProps) {
  const [run, setRun] = useState(0);
  return <TrainingRun key={run} {...props} onRestart={() => setRun((r) => r + 1)} />;
}
