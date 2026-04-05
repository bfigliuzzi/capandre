"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTTS } from "@/hooks/use-tts";
import {
  extractArticle,
  computeMaskedPositions,
  shuffleArray,
  computeResults,
  type ExerciseLevel,
  type ExerciseWord,
} from "@/lib/exercise";
import type { Dictation } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DicteeExerciseProps {
  dictation: Dictation;
}

type Phase = "select" | "exercise";

const LEVELS: { id: ExerciseLevel; label: string; stars: string; desc: string }[] = [
  { id: "discovery", label: "Découverte", stars: "⭐", desc: "Quelques lettres cachées (1/3)" },
  { id: "learning", label: "Apprentissage", stars: "⭐⭐", desc: "Beaucoup de lettres cachées (3/4)" },
  { id: "mastery", label: "Maîtrise", stars: "⭐⭐⭐", desc: "Toutes les lettres cachées" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DicteeExercise({ dictation }: DicteeExerciseProps) {
  const router = useRouter();
  const { speak, isAvailable: ttsAvailable, isSpeaking, isCooldown: ttsCooldown } = useTTS();

  // --- State ---
  const [phase, setPhase] = useState<Phase>("select");
  const [level, setLevel] = useState<ExerciseLevel>("discovery");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quitModalOpen, setQuitModalOpen] = useState(false);

  // Exercise data (set on start)
  const [exerciseWords, setExerciseWords] = useState<ExerciseWord[]>([]);
  const [wordOrder, setWordOrder] = useState<number[]>([]);
  const [maskedPositions, setMaskedPositions] = useState<number[][]>([]);
  const [userAnswers, setUserAnswers] = useState<string[][]>([]);
  const [wordVisited, setWordVisited] = useState<boolean[]>([]);

  // Refs
  const levelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const letterContainerRef = useRef<HTMLDivElement>(null);

  // --- Derived ---
  const totalWords = exerciseWords.length;
  const realIdx = wordOrder[currentIndex] ?? 0;
  const currentWord = exerciseWords[realIdx];
  const currentMasked = useMemo(() => maskedPositions[realIdx] ?? [], [maskedPositions, realIdx]);
  const currentAnswers = useMemo(() => userAnswers[realIdx] ?? [], [userAnswers, realIdx]);

  const isWordFilled = useMemo(() => {
    if (!currentMasked.length) return false;
    return currentMasked.every((pos) => !!currentAnswers[pos]);
  }, [currentMasked, currentAnswers]);

  const isLastWord = currentIndex === totalWords - 1;
  const allVisited = wordVisited.every(Boolean);
  const showValidate = phase === "exercise" && (isLastWord || allVisited);

  // --- Prepare words from dictation ---
  const prepareWords = useCallback((): ExerciseWord[] => {
    return dictation.words.map((w) => {
      const { article, baseWord } = extractArticle(w.text);
      return { article, baseWord, originalText: w.text };
    });
  }, [dictation.words]);

  // --- Start exercise ---
  const startExercise = useCallback(() => {
    const words = prepareWords();
    const n = words.length;
    const order = shuffleArray(Array.from({ length: n }, (_, i) => i));
    const masks = words.map((w) => computeMaskedPositions(w.baseWord, level));
    const answers = words.map((w) => new Array(w.baseWord.length).fill("") as string[]);
    const visited = new Array(n).fill(false) as boolean[];
    visited[order[0]] = true;

    setExerciseWords(words);
    setWordOrder(order);
    setMaskedPositions(masks);
    setUserAnswers(answers);
    setWordVisited(visited);
    setCurrentIndex(0);
    setPhase("exercise");

    // Auto TTS first word after delay
    const firstWord = words[order[0]];
    const text = firstWord.article
      ? `${firstWord.article} ${firstWord.baseWord}`
      : firstWord.baseWord;
    setTimeout(() => speak(text), 400);
  }, [prepareWords, level, speak]);

  // --- Navigation ---
  const goToWord = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalWords || index === currentIndex) return;
      setCurrentIndex(index);
      setWordVisited((prev) => {
        const next = [...prev];
        next[wordOrder[index]] = true;
        return next;
      });

      // Auto TTS
      const w = exerciseWords[wordOrder[index]];
      if (w) {
        const text = w.article ? `${w.article} ${w.baseWord}` : w.baseWord;
        setTimeout(() => speak(text), 300);
      }
    },
    [totalWords, currentIndex, wordOrder, exerciseWords, speak],
  );

  const nextWord = useCallback(() => goToWord(currentIndex + 1), [goToWord, currentIndex]);
  const prevWord = useCallback(() => goToWord(currentIndex - 1), [goToWord, currentIndex]);

  // --- Letter input ---
  const updateAnswer = useCallback(
    (letterIndex: number, value: string) => {
      setUserAnswers((prev) => {
        const next = prev.map((a) => [...a]);
        next[realIdx][letterIndex] = value;
        return next;
      });
    },
    [realIdx],
  );

  const handleLetterInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>, letterIndex: number) => {
      const input = e.currentTarget;
      let val = input.value;
      if (val.length > 1) val = val.charAt(val.length - 1);
      input.value = val;
      updateAnswer(letterIndex, val);

      // Auto-advance to next empty input
      if (val && letterContainerRef.current) {
        const inputs = Array.from(
          letterContainerRef.current.querySelectorAll<HTMLInputElement>(".letter-input"),
        );
        const currentPos = inputs.indexOf(input);
        for (let i = currentPos + 1; i < inputs.length; i++) {
          if (!inputs[i].value) {
            inputs[i].focus();
            return;
          }
        }
        for (let i = 0; i < currentPos; i++) {
          if (!inputs[i].value) {
            inputs[i].focus();
            return;
          }
        }
      }
    },
    [updateAnswer],
  );

  const handleLetterKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      if (!letterContainerRef.current) return;
      const inputs = Array.from(
        letterContainerRef.current.querySelectorAll<HTMLInputElement>(".letter-input"),
      );
      const pos = inputs.indexOf(input);

      if (e.key === "Backspace" && !input.value && pos > 0) {
        e.preventDefault();
        const prev = inputs[pos - 1];
        const prevLetterIndex = Number(prev.dataset.index);
        prev.value = "";
        updateAnswer(prevLetterIndex, "");
        prev.focus();
      } else if (e.key === "ArrowLeft" && pos > 0) {
        e.preventDefault();
        inputs[pos - 1].focus();
      } else if (e.key === "ArrowRight" && pos < inputs.length - 1) {
        e.preventDefault();
        inputs[pos + 1].focus();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (!isLastWord) nextWord();
      }
    },
    [updateAnswer, isLastWord, nextWord],
  );

  // --- Focus first empty input on word change ---
  useEffect(() => {
    if (phase !== "exercise" || !letterContainerRef.current) return;
    const inputs = letterContainerRef.current.querySelectorAll<HTMLInputElement>(".letter-input");
    for (const input of inputs) {
      if (!input.value) {
        setTimeout(() => input.focus(), 50);
        return;
      }
    }
    if (inputs.length > 0) setTimeout(() => inputs[0].focus(), 50);
  }, [phase, currentIndex]);

  // --- TTS speak current word ---
  const speakCurrentWord = useCallback(() => {
    if (!currentWord) return;
    const text = currentWord.article
      ? `${currentWord.article} ${currentWord.baseWord}`
      : currentWord.baseWord;
    speak(text);
  }, [currentWord, speak]);

  // --- Validate ---
  const handleValidate = useCallback(() => {
    const results = computeResults(
      dictation.title,
      level,
      exerciseWords,
      maskedPositions,
      userAnswers,
    );
    sessionStorage.setItem("dicteeResults", JSON.stringify(results));
    router.push(`/dictee/${dictation.id}/correction`);
  }, [dictation, level, exerciseWords, maskedPositions, userAnswers, router]);

  // --- Difficulty keyboard nav ---
  const handleLevelKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let next = index;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        next = (index + 1) % LEVELS.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        next = (index - 1 + LEVELS.length) % LEVELS.length;
      }
      if (next !== index) {
        levelRefs.current[next]?.focus();
        setLevel(LEVELS[next].id);
      }
    },
    [],
  );



  // =========================================================================
  // RENDER: Phase Select
  // =========================================================================

  if (phase === "select") {
    return (
      <div className="flex flex-col gap-6 exercise-fade-in">
        {/* TTS Warning */}
        {!ttsAvailable && (
          <div
            className="flex items-start gap-2.5 p-4 bg-[#FEF3C7] border border-[#F59E0B] rounded-xl text-sm text-[#92400E] leading-normal"
            role="alert"
          >
            <span className="shrink-0 text-lg leading-none" aria-hidden="true">⚠️</span>
            <span>La synthèse vocale n&apos;est pas disponible sur ce navigateur. Un adulte peut dicter les mots à voix haute.</span>
          </div>
        )}

        {/* Intro */}
        <div className="text-center py-4">
          <div className="text-5xl mb-3" aria-hidden="true">📝</div>
          <h2 className="font-heading text-2xl font-extrabold">{dictation.title}</h2>
          <p className="text-base text-muted-foreground mt-1">
            {dictation.words.length}&nbsp;mot{dictation.words.length > 1 ? "s" : ""} en mode mots isolés
          </p>
        </div>

        {/* Difficulty Selection */}
        <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Choisis ton niveau
        </h3>

        <div
          className="flex flex-col gap-2 md:flex-row md:gap-4"
          role="radiogroup"
          aria-label="Choisis ton niveau de difficulté"
        >
          {LEVELS.map((l, i) => (
            <button
              key={l.id}
              ref={(el) => { levelRefs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={level === l.id}
              tabIndex={level === l.id ? 0 : -1}
              onClick={() => setLevel(l.id)}
              onKeyDown={(e) => handleLevelKeyDown(e, i)}
              className={cn(
                "difficulty-card",
                level === l.id && "difficulty-card--active",
              )}
            >
              <div className="text-2xl shrink-0 w-12 text-center" aria-hidden="true">{l.stars}</div>
              <div className="flex-1">
                <div className="font-heading font-bold text-base">{l.label}</div>
                <div className="text-sm text-muted-foreground">{l.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <Button onClick={startExercise} className="w-full" aria-label="Commencer l'exercice">
          Commencer
        </Button>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Phase Exercise
  // =========================================================================

  return (
    <div className="flex flex-col gap-5 exercise-fade-in">
      {/* TTS Warning */}
      {!ttsAvailable && (
        <div
          className="flex items-start gap-2.5 p-4 bg-[#FEF3C7] border border-[#F59E0B] rounded-xl text-sm text-[#92400E] leading-normal"
          role="alert"
        >
          <span className="shrink-0 text-lg leading-none" aria-hidden="true">⚠️</span>
          <span>La synthèse vocale n&apos;est pas disponible. Un adulte peut dicter les mots.</span>
        </div>
      )}

      {/* Progress */}
      <div>
        <div
          className="exercise-progress-bar"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalWords}
          aria-label="Progression de l'exercice"
        >
          <div
            className="exercise-progress-fill"
            style={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }}
          />
        </div>
        <p className="text-sm font-bold text-muted-foreground text-center mt-2">
          Mot&nbsp;{currentIndex + 1}&nbsp;/&nbsp;{totalWords}
        </p>
      </div>

      {/* Word Dots */}
      <div className="flex justify-center gap-2 flex-wrap" role="navigation" aria-label="Navigation entre les mots">
        {wordOrder.map((_, i) => {
          const rIdx = wordOrder[i];
          const answered = currentMasked.length > 0
            ? maskedPositions[rIdx]?.every((pos) => !!userAnswers[rIdx]?.[pos])
            : false;
          const visited = wordVisited[rIdx];
          return (
            <button
              key={i}
              onClick={() => goToWord(i)}
              aria-label={`Aller au mot ${i + 1}`}
              className={cn(
                "word-dot",
                i === currentIndex && "word-dot--current",
                i !== currentIndex && answered && "word-dot--answered",
                i !== currentIndex && !answered && visited && "word-dot--skipped",
              )}
            />
          );
        })}
      </div>

      {/* Word Card */}
      {currentWord && (
        <div className="flex flex-col items-center justify-center gap-5 bg-card border-2 border-border rounded-xl p-6 shadow-md min-h-48">
          {/* TTS Button */}
          <button
            onClick={speakCurrentWord}
            disabled={ttsCooldown || !ttsAvailable}
            className={cn(
              "tts-btn",
              isSpeaking && "tts-btn--active",
              ttsCooldown && "tts-btn--cooldown",
            )}
            aria-label="Écouter le mot"
          >
            <Volume2 className="size-5 shrink-0" />
            <span>Écouter</span>
          </button>

          {/* Article */}
          {currentWord.article && (
            <div className="font-heading text-2xl font-medium text-muted-foreground">
              {currentWord.article}
            </div>
          )}

          {/* Letter Boxes */}
          <div
            ref={letterContainerRef}
            className="flex justify-center gap-1.5 flex-wrap"
            aria-label="Lettres du mot"
          >
            {Array.from(currentWord.baseWord).map((char, i) => {
              const isMasked = currentMasked.includes(i);
              if (isMasked) {
                return (
                  <input
                    key={`${realIdx}-${i}`}
                    type="text"
                    maxLength={1}
                    className="letter-input"
                    data-index={i}
                    aria-label={`Lettre ${i + 1} sur ${currentWord.baseWord.length}`}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    defaultValue={currentAnswers[i] ?? ""}
                    onInput={(e) => handleLetterInput(e, i)}
                    onKeyDown={handleLetterKeydown}
                  />
                );
              }
              return (
                <span key={`${realIdx}-${i}`} className="letter-given">
                  {char}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-2 justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevWord}
          disabled={currentIndex === 0}
          aria-label="Mot précédent"
        >
          <ArrowLeft className="size-4" />
          Précédent
        </Button>

        {!isLastWord && !isWordFilled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={nextWord}
            aria-label="Passer ce mot"
          >
            Passer
            <ChevronRight className="size-4" />
          </Button>
        )}

        {!isLastWord && isWordFilled && (
          <Button
            size="sm"
            onClick={nextWord}
            aria-label="Mot suivant"
          >
            Suivant
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>

      {/* Validate */}
      {showValidate && (
        <Button onClick={handleValidate} className="w-full exercise-fade-in">
          Valider mes réponses
        </Button>
      )}

      {/* Quit Modal */}
      <AlertDialog open={quitModalOpen} onOpenChange={setQuitModalOpen}>
        <AlertDialogContent>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="text-4xl" aria-hidden="true">⚠️</div>
            <AlertDialogTitle>Quitter l&apos;exercice ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta progression sera perdue. Tu devras recommencer depuis le début.
            </AlertDialogDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end mt-2">
            <AlertDialogClose
              render={<Button variant="ghost" className="w-full sm:w-auto">Continuer</Button>}
            />
            <AlertDialogClose
              render={
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  onClick={() => router.push("/dictee")}
                >
                  Quitter
                </Button>
              }
            />
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
