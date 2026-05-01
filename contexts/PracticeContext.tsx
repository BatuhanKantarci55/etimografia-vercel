import { supabase } from "@lib/supabase";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

// Kelime tipi
interface Word {
  id: number;
  old_turkish_word: string;
  old_turkish_origin: string;
  new_turkish_word: string;
  new_turkish_origin: string;
  definition: string;
  old_equivalents: string[];
  new_equivalents: string[];
  difficulty_level: number;
  word_unit: number;
  word_stage: number;
}

// Alıştırma filtreleri için tip
export type PracticeFilters = {
  type: "multiple-choice" | "classic" | null;
  direction: "old-to-new" | "new-to-old" | null;
  difficulty: number[] | null;
  origin: string[] | null;
  unit: number[] | null;
};

// Aktif alıştırma oturumu için tip
export type ActivePracticeSession = {
  id: string;
  type: "multiple-choice" | "classic";
  direction: "old-to-new" | "new-to-old";
  difficulty: number[] | null;
  origin: string[] | null;
  unit: number[] | null;
  totalScore: number;
  correctAnswers: number;
  wrongAnswers: number;
  currentCombo: number;
  highestCombo: number;
  askedWordIds: number[];
};

// İstatistikler için tip
export type PracticeStatistics = {
  total_practice_score: number;
  total_multiple_choice_score: number;
  total_classic_score: number;
  highest_multiple_choice_score: number;
  highest_classic_score: number;
};

// Yanlış yapılan kelimeler için tip
export type PracticeMistake = {
  id: string;
  word_id: number;
  word_text: string;
  created_at: string;
};

type PracticeContextType = {
  // Filtreler
  filters: PracticeFilters;
  setFilters: (filters: Partial<PracticeFilters>) => void;
  clearFilters: () => void;

  // Aktif oturum
  activeSession: ActivePracticeSession | null;
  startPractice: (filters: PracticeFilters) => Promise<string | null>;
  endPractice: (saveStats?: boolean) => Promise<void>;
  updateSessionProgress: (isCorrect: boolean, pointsEarned: number) => void;

  // İstatistikler
  statistics: PracticeStatistics | null;
  fetchStatistics: () => Promise<void>;

  // Yanlış kelimeler
  mistakes: PracticeMistake[];
  fetchMistakes: () => Promise<void>;
  addMistake: (wordId: number, wordText: string) => Promise<void>;

  // Kelime havuzu
  wordPool: Word[];
  currentWordIndex: number;
  getWordPool: (filters: PracticeFilters) => Promise<Word[]>;
  getNextWord: () => Word | null;
  markWordAsAsked: (wordId: number) => void;

  // Loading durumları
  isLoading: boolean;
  isSessionActive: boolean;
};

const PracticeContext = createContext<PracticeContextType>({
  filters: {
    type: null,
    direction: null,
    difficulty: null,
    origin: null,
    unit: null,
  },
  setFilters: () => {},
  clearFilters: () => {},
  activeSession: null,
  startPractice: async () => null,
  endPractice: async () => {},
  updateSessionProgress: () => {},
  statistics: null,
  fetchStatistics: async () => {},
  mistakes: [],
  fetchMistakes: async () => {},
  addMistake: async () => {},
  wordPool: [],
  currentWordIndex: 0,
  getWordPool: async () => [],
  getNextWord: () => null,
  markWordAsAsked: () => {},
  isLoading: false,
  isSessionActive: false,
});

export const usePractice = () => useContext(PracticeContext);

// Kelime verileri
const wordsData = require("../assets/data/words.json") as Word[];

export const PracticeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();

  // Filtreler
  const [filters, setFiltersState] = useState<PracticeFilters>({
    type: null,
    direction: null,
    difficulty: null,
    origin: null,
    unit: null,
  });

  // Aktif oturum
  const [activeSession, setActiveSession] =
    useState<ActivePracticeSession | null>(null);

  // İstatistikler
  const [statistics, setStatistics] = useState<PracticeStatistics | null>(null);

  // Yanlış kelimeler
  const [mistakes, setMistakes] = useState<PracticeMistake[]>([]);

  // Kelime havuzu
  const [wordPool, setWordPool] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Loading
  const [isLoading, setIsLoading] = useState(false);

  // Oturum bitirme işleminin devam ettiğini işaretle
  const isEndingPractice = useRef(false);

  // Filtreleri güncelle
  const setFilters = useCallback((newFilters: Partial<PracticeFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Filtreleri temizle
  const clearFilters = useCallback(() => {
    setFiltersState({
      type: null,
      direction: null,
      difficulty: null,
      origin: null,
      unit: null,
    });
  }, []);

  // Kelime havuzu oluştur
  const getWordPool = useCallback(
    async (filters: PracticeFilters): Promise<Word[]> => {
      try {
        let filtered = [...wordsData];

        // Zorluk filtresi
        if (filters.difficulty && filters.difficulty.length > 0) {
          filtered = filtered.filter((word) =>
            filters.difficulty!.includes(word.difficulty_level),
          );
        }

        // Köken filtresi
        if (filters.origin && filters.origin.length > 0) {
          filtered = filtered.filter(
            (word) =>
              filters.origin!.includes(word.old_turkish_origin) ||
              filters.origin!.includes(word.new_turkish_origin),
          );
        }

        // Ünite filtresi
        if (filters.unit && filters.unit.length > 0) {
          filtered = filtered.filter((word) =>
            filters.unit!.includes(word.word_unit),
          );
        }

        // Rastgele karıştır
        const shuffled = filtered.sort(() => Math.random() - 0.5);

        // Daha önce sorulan kelimeleri çıkar (aktif oturum varsa)
        if (activeSession) {
          return shuffled.filter(
            (word) => !activeSession.askedWordIds.includes(word.id),
          );
        }

        return shuffled;
      } catch (error) {
        console.error("Kelime havuzu oluşturulurken hata:", error);
        return [];
      }
    },
    [activeSession],
  );

  // Sonraki kelimeyi al
  const getNextWord = useCallback(() => {
    if (wordPool.length === 0) return null;
    if (currentWordIndex >= wordPool.length) return null;
    return wordPool[currentWordIndex];
  }, [wordPool, currentWordIndex]);

  // Sorulan kelimeyi işaretle
  const markWordAsAsked = useCallback(
    (wordId: number) => {
      if (!activeSession) return;

      setActiveSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          askedWordIds: [...prev.askedWordIds, wordId],
        };
      });

      setCurrentWordIndex((prev) => prev + 1);
    },
    [activeSession],
  );

  // Alıştırma başlat
  const startPractice = useCallback(
    async (sessionFilters: PracticeFilters): Promise<string | null> => {
      // DEĞİŞİKLİK: if (!user) return null; kaldırıldı. Artık misafirler de başlayabilir.

      setIsLoading(true);
      try {
        let sessionId = `guest_${Date.now()}`;

        // Eğer kullanıcı giriş yapmışsa Supabase'e ekle
        if (user) {
          const { data, error } = await supabase
            .from("practice_sessions")
            .insert({
              user_id: user.id,
              type: sessionFilters.type,
              direction: sessionFilters.direction,
              difficulty: sessionFilters.difficulty,
              origin: sessionFilters.origin,
              unit: sessionFilters.unit,
              total_score: 0,
              correct_answers: 0,
              wrong_answers: 0,
              highest_combo: 0,
            })
            .select()
            .single();

          if (error) throw error;
          sessionId = data.id;
        }

        // Aktif oturumu ayarla (Kullanıcı yoksa yerel (guest) ID ile)
        const newSession: ActivePracticeSession = {
          id: sessionId,
          type: sessionFilters.type as "multiple-choice" | "classic",
          direction: sessionFilters.direction as "old-to-new" | "new-to-old",
          difficulty: sessionFilters.difficulty,
          origin: sessionFilters.origin,
          unit: sessionFilters.unit,
          totalScore: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          currentCombo: 0,
          highestCombo: 0,
          askedWordIds: [],
        };

        setActiveSession(newSession);

        // Kelime havuzunu oluştur
        const pool = await getWordPool(sessionFilters);
        setWordPool(pool);
        setCurrentWordIndex(0);

        return sessionId;
      } catch (error) {
        console.error("Alıştırma başlatılırken hata:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user, getWordPool],
  );

  // Oturum ilerlemesini güncelle
  const updateSessionProgress = useCallback(
    (isCorrect: boolean, pointsEarned: number) => {
      if (!activeSession) return;

      setActiveSession((prev) => {
        if (!prev) return null;

        const newCorrectAnswers = prev.correctAnswers + (isCorrect ? 1 : 0);
        const newWrongAnswers = prev.wrongAnswers + (isCorrect ? 0 : 1);
        const newTotalScore = prev.totalScore + pointsEarned;

        // Combo hesaplama
        let newCombo = isCorrect ? prev.currentCombo + 1 : 0;
        const newHighestCombo = Math.max(prev.highestCombo, newCombo);

        return {
          ...prev,
          correctAnswers: newCorrectAnswers,
          wrongAnswers: newWrongAnswers,
          totalScore: newTotalScore,
          currentCombo: newCombo,
          highestCombo: newHighestCombo,
        };
      });
    },
    [activeSession],
  );

  // Alıştırmayı bitir
  const endPractice = useCallback(
    async (saveStats: boolean = true) => {
      // DEĞİŞİKLİK: if (!user) return; kaldırıldı. Artık misafir oturumları da düzgünce kapatılıyor.
      if (!activeSession) return;

      // Oturum zaten bitiyorsa tekrar başlatma
      if (isEndingPractice.current) return;

      isEndingPractice.current = true;
      setIsLoading(true);

      try {
        // YALNIZCA GİRİŞ YAPMIŞ KULLANICILAR VE MİSAFİR OLMAYAN OTURUMLAR İÇİN DATABASE'E KAYDET
        if (saveStats && user && !activeSession.id.startsWith("guest_")) {
          // Oturumu güncelle
          const { error: sessionError } = await supabase
            .from("practice_sessions")
            .update({
              total_score: activeSession.totalScore,
              correct_answers: activeSession.correctAnswers,
              wrong_answers: activeSession.wrongAnswers,
              highest_combo: activeSession.highestCombo,
              ended_at: new Date().toISOString(),
            })
            .eq("id", activeSession.id);

          if (sessionError) throw sessionError;

          // İstatistikleri güncelle
          const { data: existingStats } = await supabase
            .from("practice_statistics")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (existingStats) {
            // Var olan istatistikleri güncelle
            const updates: any = {
              total_practice_score:
                existingStats.total_practice_score + activeSession.totalScore,
              updated_at: new Date().toISOString(),
            };

            if (activeSession.type === "multiple-choice") {
              updates.total_multiple_choice_score =
                existingStats.total_multiple_choice_score +
                activeSession.totalScore;
              if (
                activeSession.totalScore >
                existingStats.highest_multiple_choice_score
              ) {
                updates.highest_multiple_choice_score =
                  activeSession.totalScore;
              }
            } else {
              updates.total_classic_score =
                existingStats.total_classic_score + activeSession.totalScore;
              if (
                activeSession.totalScore > existingStats.highest_classic_score
              ) {
                updates.highest_classic_score = activeSession.totalScore;
              }
            }

            await supabase
              .from("practice_statistics")
              .update(updates)
              .eq("user_id", user.id);
          } else {
            // Yeni istatistik oluştur
            const newStats: any = {
              user_id: user.id,
              total_practice_score: activeSession.totalScore,
              updated_at: new Date().toISOString(),
            };

            if (activeSession.type === "multiple-choice") {
              newStats.total_multiple_choice_score = activeSession.totalScore;
              newStats.highest_multiple_choice_score = activeSession.totalScore;
              newStats.total_classic_score = 0;
              newStats.highest_classic_score = 0;
            } else {
              newStats.total_classic_score = activeSession.totalScore;
              newStats.highest_classic_score = activeSession.totalScore;
              newStats.total_multiple_choice_score = 0;
              newStats.highest_multiple_choice_score = 0;
            }

            await supabase.from("practice_statistics").insert(newStats);
          }

          // İstatistikleri yenile
          await fetchStatistics();
        }

        // Aktif oturumu her halükarda temizle (giriş yapmış olsun veya olmasın)
        setActiveSession(null);
        setWordPool([]);
        setCurrentWordIndex(0);
      } catch (error) {
        console.error("Alıştırma bitirilirken hata:", error);
      } finally {
        setIsLoading(false);
        // Biraz gecikmeli olarak ending flag'ini sıfırla
        setTimeout(() => {
          isEndingPractice.current = false;
        }, 500);
      }
    },
    [user, activeSession],
  );

  // İstatistikleri getir
  const fetchStatistics = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("practice_statistics")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setStatistics(data);
      } else {
        // Kayıt yoksa varsayılan değerlerle oluştur
        const defaultStats: PracticeStatistics = {
          total_practice_score: 0,
          total_multiple_choice_score: 0,
          total_classic_score: 0,
          highest_multiple_choice_score: 0,
          highest_classic_score: 0,
        };
        setStatistics(defaultStats);
      }
    } catch (error) {
      console.error("İstatistikler alınırken hata:", error);
    }
  }, [user]);

  // Yanlış kelimeleri getir
  const fetchMistakes = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("practice_mistakes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMistakes(data || []);
    } catch (error) {
      console.error("Yanlış kelimeler alınırken hata:", error);
    }
  }, [user]);

  // Yanlış kelime ekle
  const addMistake = useCallback(
    async (wordId: number, wordText: string) => {
      // DEĞİŞİKLİK: Kullanıcı yoksa işlem yapmadan çık, hata verme. Misafirler yanlış yapabilir ancak veri kaydedilmez.
      if (!user) return;

      try {
        // Önce var mı kontrol et
        const { data: existing } = await supabase
          .from("practice_mistakes")
          .select("id")
          .eq("user_id", user.id)
          .eq("word_id", wordId)
          .maybeSingle();

        if (!existing) {
          // Yoksa ekle
          const { error } = await supabase.from("practice_mistakes").insert({
            user_id: user.id,
            word_id: wordId,
            word_text: wordText,
          });

          if (error) throw error;

          // Listeyi yenile
          await fetchMistakes();
        }
      } catch (error) {
        console.error("Yanlış kelime eklenirken hata:", error);
      }
    },
    [user, fetchMistakes],
  );

  // Kullanıcı değiştiğinde verileri getir
  useEffect(() => {
    if (user) {
      fetchStatistics();
      fetchMistakes();
    } else {
      setStatistics(null);
      setMistakes([]);
      setActiveSession(null);
      setWordPool([]);
      setCurrentWordIndex(0);
    }
  }, [user, fetchStatistics, fetchMistakes]);

  return (
    <PracticeContext.Provider
      value={{
        filters,
        setFilters,
        clearFilters,
        activeSession,
        startPractice,
        endPractice,
        updateSessionProgress,
        statistics,
        fetchStatistics,
        mistakes,
        fetchMistakes,
        addMistake,
        wordPool,
        currentWordIndex,
        getWordPool,
        getNextWord,
        markWordAsAsked,
        isLoading,
        isSessionActive: !!activeSession,
      }}
    >
      {children}
    </PracticeContext.Provider>
  );
};
