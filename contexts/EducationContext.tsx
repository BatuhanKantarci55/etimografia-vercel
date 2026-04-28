import { supabase } from "@lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RealtimeChannel } from "@supabase/supabase-js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

// Word tipi
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

// İlerleme tipi
interface EducationProgress {
  id: string;
  user_id: string;
  current_unit: number;
  current_stage: number;
  current_step: number; // 1: öğrenme, 2: pekiştirme, 3: sınav
  total_stages_completed: number;
  updated_at: string;
}

// Kelime durumu tipi
interface WordStatus {
  word_id: number;
  status: "known" | "learning";
}

// Tamamlanan aşama tipi
interface CompletedStage {
  unit_number: number;
  stage_number: number;
  completed_at: string;
}

// Puan tipi
interface EducationScore {
  id: string;
  user_id: string;
  total_education_score: number;
  updated_at: string;
}

// Adım puanı tipi
interface StepScore {
  step1Points: number; // 25 (tamamlama)
  step2Points: number; // Her doğru cevap için 2 puan
  step3Points: number; // Her doğru cevap için kelime zorluğu * 2
  totalPoints: number;
}

// Context tipi
interface EducationContextType {
  progress: EducationProgress | null;
  wordStatuses: Map<number, "known" | "learning">;
  completedStages: CompletedStage[];
  educationScore: EducationScore | null;
  loading: boolean;

  // İlerleme işlemleri
  loadProgress: () => Promise<void>;
  updateProgress: (unit: number, stage: number, step: number) => Promise<void>;
  completeCurrentStage: () => Promise<void>;

  // Kelime durumu işlemleri (tekli)
  markWordAsKnown: (wordId: number) => Promise<void>;
  markWordAsLearning: (wordId: number) => Promise<void>;

  // Toplu kelime işaretleme
  markWordsBatch: (
    selections: { wordId: number; action: "known" | "learning" }[],
  ) => Promise<void>;

  // Kelime getirme fonksiyonları
  getLearningWordsForCurrentStage: () => Word[];
  getKnownWordsForCurrentStage: () => Word[];
  getAllWordsForCurrentStage: () => Word[];

  // Adım geçişleri
  goToNextStep: () => Promise<void>;
  resetToFirstStep: () => Promise<void>;

  // Puan işlemleri
  loadEducationScore: () => Promise<void>;
  addEducationPoints: (points: number) => Promise<void>;
  getStepPoints: (
    step: number,
    correctAnswers?: { wordId: number; difficulty: number }[],
  ) => StepScore;
}

const EducationContext = createContext<EducationContextType>({
  progress: null,
  wordStatuses: new Map(),
  completedStages: [],
  educationScore: null,
  loading: true,
  loadProgress: async () => {},
  updateProgress: async () => {},
  completeCurrentStage: async () => {},
  markWordAsKnown: async () => {},
  markWordAsLearning: async () => {},
  markWordsBatch: async () => {},
  getLearningWordsForCurrentStage: () => [],
  getKnownWordsForCurrentStage: () => [],
  getAllWordsForCurrentStage: () => [],
  goToNextStep: async () => {},
  resetToFirstStep: async () => {},
  loadEducationScore: async () => {},
  addEducationPoints: async () => {},
  getStepPoints: () => ({
    step1Points: 0,
    step2Points: 0,
    step3Points: 0,
    totalPoints: 0,
  }),
});

export const useEducation = () => useContext(EducationContext);

export const EducationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<EducationProgress | null>(null);
  const [wordStatuses, setWordStatuses] = useState<
    Map<number, "known" | "learning">
  >(new Map());
  const [completedStages, setCompletedStages] = useState<CompletedStage[]>([]);
  const [educationScore, setEducationScore] = useState<EducationScore | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // wordsData'yı useMemo ile sarmala
  const wordsData = React.useMemo(() => {
    try {
      return require("@assets/data/words.json") as Word[];
    } catch (error) {
      console.error("words.json yüklenirken hata:", error);
      return [];
    }
  }, []);

  const progressChannel = useRef<RealtimeChannel | null>(null);
  const wordStatusChannel = useRef<RealtimeChannel | null>(null);
  const completedStagesChannel = useRef<RealtimeChannel | null>(null);
  const scoreChannel = useRef<RealtimeChannel | null>(null);

  // AsyncStorage yardımcıları
  const saveToStorage = useCallback(async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(`education_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error("AsyncStorage kaydetme hatası:", error);
    }
  }, []);

  const loadFromStorage = useCallback(async (key: string) => {
    try {
      const data = await AsyncStorage.getItem(`education_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("AsyncStorage yükleme hatası:", error);
      return null;
    }
  }, []);

  // İlerleme yükle
  const loadProgress = useCallback(async () => {
    if (!user) return;

    try {
      console.log("📚 Eğitim ilerlemesi yükleniyor...");

      // AsyncStorage'den yükle (debug için)
      const cachedProgress = await loadFromStorage(`progress_${user.id}`);
      console.log("📦 AsyncStorage'den yüklenen ilerleme:", cachedProgress);

      // Supabase'den yükle
      const { data, error } = await supabase
        .from("education_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        // Veritabanında veri varsa, onu kullan ve AsyncStorage'i güncelle
        console.log("✅ Veritabanından ilerleme bulundu:", data);
        setProgress(data);
        await saveToStorage(`progress_${user.id}`, data);
      } else {
        // Veritabanında veri yoksa, AsyncStorage'deki veriyi TEMİZLE
        console.log(
          "❌ Veritabanında ilerleme bulunamadı, AsyncStorage temizleniyor...",
        );

        // AsyncStorage'deki ilerlemeyi temizle
        await AsyncStorage.removeItem(`education_progress_${user.id}`);

        // Varsayılan ilerlemeyi oluştur
        const defaultProgress = {
          user_id: user.id,
          current_unit: 1,
          current_stage: 1,
          current_step: 1,
          total_stages_completed: 0,
        };

        console.log("🆕 Varsayılan ilerleme oluşturuluyor:", defaultProgress);

        const { data: newData, error: insertError } = await supabase
          .from("education_progress")
          .insert(defaultProgress)
          .select()
          .maybeSingle();

        if (insertError) throw insertError;

        if (newData) {
          setProgress(newData);
          await saveToStorage(`progress_${user.id}`, newData);
        }
      }
    } catch (error) {
      console.error("İlerleme yüklenirken hata:", error);

      // Hata durumunda bile AsyncStorage'i temizle ve varsayılanı dene
      try {
        await AsyncStorage.removeItem(`education_progress_${user.id}`);

        const defaultProgress = {
          user_id: user.id,
          current_unit: 1,
          current_stage: 1,
          current_step: 1,
          total_stages_completed: 0,
        };

        const { data: newData } = await supabase
          .from("education_progress")
          .insert(defaultProgress)
          .select()
          .maybeSingle();

        if (newData) {
          setProgress(newData);
          await saveToStorage(`progress_${user.id}`, newData);
        }
      } catch (fallbackError) {
        console.error("Kurtarma denemesi de başarısız:", fallbackError);
      }
    }
  }, [user, loadFromStorage, saveToStorage]);

  // Kelime durumlarını yükle
  const loadWordStatuses = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("education_word_status")
        .select("word_id, status")
        .eq("user_id", user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const statusMap = new Map();
        data?.forEach((item) => {
          statusMap.set(item.word_id, item.status);
        });

        setWordStatuses(statusMap);
        await saveToStorage(
          `word_status_${user.id}`,
          Array.from(statusMap.entries()),
        );
        console.log(`✅ ${data.length} kelime durumu yüklendi`);
      } else {
        // Veritabanında kelime durumu yoksa AsyncStorage'i temizle
        console.log(
          "❌ Veritabanında kelime durumu bulunamadı, AsyncStorage temizleniyor...",
        );
        await AsyncStorage.removeItem(`education_word_status_${user.id}`);
        setWordStatuses(new Map());
      }
    } catch (error) {
      console.error("Kelime durumları yüklenirken hata:", error);
      setWordStatuses(new Map());
    }
  }, [user, saveToStorage]);

  // Tamamlanan aşamaları yükle
  const loadCompletedStages = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("education_completed_stages")
        .select("unit_number, stage_number, completed_at")
        .eq("user_id", user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        setCompletedStages(data || []);
        await saveToStorage(`completed_stages_${user.id}`, data);
        console.log(`✅ ${data.length} tamamlanan aşama yüklendi`);
      } else {
        // Veritabanında tamamlanan aşama yoksa AsyncStorage'i temizle
        console.log(
          "❌ Veritabanında tamamlanan aşama bulunamadı, AsyncStorage temizleniyor...",
        );
        await AsyncStorage.removeItem(`education_completed_stages_${user.id}`);
        setCompletedStages([]);
      }
    } catch (error) {
      console.error("Tamamlanan aşamalar yüklenirken hata:", error);
      setCompletedStages([]);
    }
  }, [user, saveToStorage]);

  // Eğitim puanını yükle
  const loadEducationScore = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("education_scores")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setEducationScore(data);
        await saveToStorage(`score_${user.id}`, data);
      } else {
        // Puan kaydı yoksa oluştur
        const defaultScore = {
          user_id: user.id,
          total_education_score: 0,
        };

        const { data: newData, error: insertError } = await supabase
          .from("education_scores")
          .insert(defaultScore)
          .select()
          .maybeSingle();

        if (insertError) throw insertError;

        if (newData) {
          setEducationScore(newData);
          await saveToStorage(`score_${user.id}`, newData);
        }
      }
    } catch (error) {
      console.error("Eğitim puanı yüklenirken hata:", error);
    }
  }, [user, saveToStorage]);

  // Puan ekle
  const addEducationPoints = useCallback(
    async (points: number) => {
      if (!user || points === 0) {
        console.log("⚠️ Puan eklenmedi: points=", points, "user=", !!user);
        return;
      }

      try {
        console.log("💰 Puan ekleniyor:", points);

        // Mevcut puanı getir
        const { data: currentScore, error: fetchError } = await supabase
          .from("education_scores")
          .select("total_education_score")
          .eq("user_id", user.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("❌ Puan getirme hatası:", fetchError);
          throw fetchError;
        }

        const currentTotal = currentScore?.total_education_score || 0;
        const newTotal = currentTotal + points;

        console.log(
          `📊 Eski toplam: ${currentTotal}, Yeni toplam: ${newTotal}`,
        );

        const { error } = await supabase.from("education_scores").upsert(
          {
            user_id: user.id,
            total_education_score: newTotal,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

        if (error) {
          console.error("❌ Puan upsert hatası:", error);
          throw error;
        }

        setEducationScore((prev) =>
          prev ? { ...prev, total_education_score: newTotal } : null,
        );
        await saveToStorage(`score_${user.id}`, {
          user_id: user.id,
          total_education_score: newTotal,
        });

        console.log(`✅ ${points} puan eklendi, yeni toplam: ${newTotal}`);
      } catch (error) {
        console.error("Puan eklenirken hata:", error);
      }
    },
    [user, saveToStorage],
  );

  // Adım puanlarını hesapla
  const getStepPoints = useCallback(
    (
      step: number,
      correctAnswers?: { wordId: number; difficulty: number }[],
    ): StepScore => {
      let step1Points = 0;
      let step2Points = 0;
      let step3Points = 0;

      if (step === 1) {
        step1Points = 25; // 1. adım tamamlama puanı
        console.log("📊 1. adım puanı hesaplandı:", step1Points);
      } else if (step === 2 && correctAnswers) {
        step2Points = correctAnswers.length * 2; // Her doğru cevap için 2 puan
        console.log(
          `📊 2. adım puanı hesaplandı: ${correctAnswers.length} doğru cevap x 2 = ${step2Points}`,
        );
      } else if (step === 3 && correctAnswers) {
        step3Points = correctAnswers.reduce((total, answer) => {
          return total + answer.difficulty * 2; // Kelime zorluğu * 2
        }, 0);
        console.log(`📊 3. adım puanı hesaplandı: ${step3Points}`);
      }

      const totalPoints = step1Points + step2Points + step3Points;

      return { step1Points, step2Points, step3Points, totalPoints };
    },
    [],
  );

  // İlerleme güncelle
  const updateProgress = useCallback(
    async (unit: number, stage: number, step: number) => {
      if (!user || !progress) return;

      try {
        const updates = {
          current_unit: unit,
          current_stage: stage,
          current_step: step,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("education_progress")
          .update(updates)
          .eq("user_id", user.id);

        if (error) throw error;

        setProgress((prev) => (prev ? { ...prev, ...updates } : null));
        await saveToStorage(`progress_${user.id}`, { ...progress, ...updates });
        console.log(
          `✅ İlerleme güncellendi: Ünite ${unit}, Aşama ${stage}, Adım ${step}`,
        );
      } catch (error) {
        console.error("İlerleme güncellenirken hata:", error);
      }
    },
    [user, progress, saveToStorage],
  );

  // Aşamayı tamamla - kelime durumlarını temizle
  const completeCurrentStage = useCallback(async () => {
    if (!user || !progress) return;

    try {
      console.log(
        `🏁 Aşama tamamlanıyor: Ünite ${progress.current_unit}, Aşama ${progress.current_stage}`,
      );

      // Tamamlanan aşamayı kaydet
      const { error: insertError } = await supabase
        .from("education_completed_stages")
        .insert({
          user_id: user.id,
          unit_number: progress.current_unit,
          stage_number: progress.current_stage,
        });

      if (insertError && insertError.code !== "23505") {
        throw insertError;
      }

      // Bu aşamadaki tüm kelime durumlarını temizle
      const wordsInStage = wordsData
        .filter(
          (word: Word) =>
            word.word_unit === progress.current_unit &&
            word.word_stage === progress.current_stage,
        )
        .map((word: Word) => word.id);

      if (wordsInStage.length > 0) {
        const { error: deleteError } = await supabase
          .from("education_word_status")
          .delete()
          .eq("user_id", user.id)
          .in("word_id", wordsInStage);

        if (deleteError) throw deleteError;

        // Local state'i güncelle
        setWordStatuses((prev) => {
          const newMap = new Map(prev);
          wordsInStage.forEach((wordId) => {
            newMap.delete(wordId);
          });
          return newMap;
        });

        console.log(`🧹 ${wordsInStage.length} kelime durumu temizlendi`);
      }

      // Toplam tamamlanan aşama sayısını artır
      const { error: updateError } = await supabase
        .from("education_progress")
        .update({
          total_stages_completed: progress.total_stages_completed + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setProgress((prev) =>
        prev
          ? {
              ...prev,
              total_stages_completed: prev.total_stages_completed + 1,
            }
          : null,
      );

      await loadCompletedStages();
      await loadWordStatuses(); // Kelime durumlarını yeniden yükle

      console.log(
        `✅ Aşama tamamlandı, toplam tamamlanan: ${progress.total_stages_completed + 1}`,
      );
    } catch (error) {
      console.error("Aşama tamamlanırken hata:", error);
    }
  }, [user, progress, wordsData, loadCompletedStages, loadWordStatuses]);

  // Tekli kelime işaretleme - "biliyorum"
  const markWordAsKnown = useCallback(
    async (wordId: number) => {
      if (!user) return;

      try {
        const { error } = await supabase.from("education_word_status").upsert(
          {
            user_id: user.id,
            word_id: wordId,
            status: "known",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,word_id" },
        );

        if (error) throw error;

        setWordStatuses((prev) => {
          const newMap = new Map(prev);
          newMap.set(wordId, "known");
          return newMap;
        });
      } catch (error) {
        console.error("Kelime işaretlenirken hata:", error);
      }
    },
    [user],
  );

  // Tekli kelime işaretleme - "öğrenmeye başla"
  const markWordAsLearning = useCallback(
    async (wordId: number) => {
      if (!user) return;

      try {
        const { error } = await supabase.from("education_word_status").upsert(
          {
            user_id: user.id,
            word_id: wordId,
            status: "learning",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,word_id" },
        );

        if (error) throw error;

        setWordStatuses((prev) => {
          const newMap = new Map(prev);
          newMap.set(wordId, "learning");
          return newMap;
        });
      } catch (error) {
        console.error("Kelime işaretlenirken hata:", error);
      }
    },
    [user],
  );

  // Toplu kelime işaretleme
  const markWordsBatch = useCallback(
    async (selections: { wordId: number; action: "known" | "learning" }[]) => {
      if (!user || selections.length === 0) return;

      try {
        const inserts = selections.map((s) => ({
          user_id: user.id,
          word_id: s.wordId,
          status: s.action,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("education_word_status")
          .upsert(inserts, { onConflict: "user_id,word_id" });

        if (error) throw error;

        // Local state'i güncelle
        setWordStatuses((prev) => {
          const newMap = new Map(prev);
          selections.forEach((s) => {
            newMap.set(s.wordId, s.action);
          });
          return newMap;
        });

        console.log(`✅ ${selections.length} kelime başarıyla işaretlendi`);
      } catch (error) {
        console.error("Toplu kelime işaretlenirken hata:", error);
      }
    },
    [user],
  );

  // Mevcut aşamadaki tüm kelimeleri getir
  const getAllWordsForCurrentStage = useCallback((): Word[] => {
    if (!progress) return [];

    return wordsData.filter(
      (word: Word) =>
        word.word_unit === progress.current_unit &&
        word.word_stage === progress.current_stage,
    );
  }, [progress, wordsData]);

  // Mevcut aşamadaki öğrenilecek kelimeleri getir (öğrenmeye başla işaretliler)
  const getLearningWordsForCurrentStage = useCallback((): Word[] => {
    if (!progress) return [];

    return wordsData.filter(
      (word: Word) =>
        word.word_unit === progress.current_unit &&
        word.word_stage === progress.current_stage &&
        wordStatuses.get(word.id) === "learning",
    );
  }, [progress, wordStatuses, wordsData]);

  // Mevcut aşamadaki bilinen kelimeleri getir (biliyorum işaretliler)
  const getKnownWordsForCurrentStage = useCallback((): Word[] => {
    if (!progress) return [];

    return wordsData.filter(
      (word: Word) =>
        word.word_unit === progress.current_unit &&
        word.word_stage === progress.current_stage &&
        wordStatuses.get(word.id) === "known",
    );
  }, [progress, wordStatuses, wordsData]);

  // Sonraki adıma geç
  const goToNextStep = useCallback(async () => {
    if (!progress) return;

    let nextUnit = progress.current_unit;
    let nextStage = progress.current_stage;
    let nextStep = progress.current_step + 1;

    if (nextStep > 3) {
      await completeCurrentStage();

      const stagesInUnit = wordsData
        .filter((w: Word) => w.word_unit === progress.current_unit)
        .reduce((acc: number[], word: Word) => {
          if (!acc.includes(word.word_stage)) acc.push(word.word_stage);
          return acc;
        }, [] as number[]).length;

      if (progress.current_stage < stagesInUnit) {
        // Aynı ünitede sonraki aşama
        nextStage = progress.current_stage + 1;
        nextStep = 1;
      } else {
        // Sonraki ünite
        nextUnit = progress.current_unit + 1;
        nextStage = 1;
        nextStep = 1;
      }
    }

    await updateProgress(nextUnit, nextStage, nextStep);
  }, [progress, updateProgress, completeCurrentStage, wordsData]);

  // İlk adıma sıfırla (başa dön)
  const resetToFirstStep = useCallback(async () => {
    if (!progress) return;
    await updateProgress(progress.current_unit, progress.current_stage, 1);
  }, [progress, updateProgress]);

  // Realtime dinleyiciler
  // DEĞİŞİKLİK: user nesnesi tamamen değiştiğinde sekme kapanmasın diye sadece id takibi yapılır.
  useEffect(() => {
    if (!user?.id) return;

    progressChannel.current = supabase
      .channel("education-progress-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "education_progress",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("🔄 Eğitim ilerlemesi güncellendi:", payload.new);
          setProgress(payload.new as EducationProgress);
        },
      )
      .subscribe();

    wordStatusChannel.current = supabase
      .channel("education-word-status-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "education_word_status",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          console.log("🔄 Kelime durumları güncellendi");
          await loadWordStatuses();
        },
      )
      .subscribe();

    completedStagesChannel.current = supabase
      .channel("education-completed-stages-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "education_completed_stages",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          console.log("🔄 Tamamlanan aşama eklendi");
          await loadCompletedStages();
        },
      )
      .subscribe();

    scoreChannel.current = supabase
      .channel("education-score-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "education_scores",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("🔄 Eğitim puanı güncellendi:", payload.new);
          setEducationScore(payload.new as EducationScore);
        },
      )
      .subscribe();

    return () => {
      if (progressChannel.current) progressChannel.current.unsubscribe();
      if (wordStatusChannel.current) wordStatusChannel.current.unsubscribe();
      if (completedStagesChannel.current)
        completedStagesChannel.current.unsubscribe();
      if (scoreChannel.current) scoreChannel.current.unsubscribe();
    };
  }, [user?.id, loadWordStatuses, loadCompletedStages]);

  // İlk yükleme
  // DEĞİŞİKLİK: Sadece "user" değil "user?.id" kullanıldı ki gereksiz yeniden yüklemeler komponenti unmount etmesin.
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (user?.id) {
        await Promise.all([
          loadProgress(),
          loadWordStatuses(),
          loadCompletedStages(),
          loadEducationScore(),
        ]);
      }
      setLoading(false);
    };

    init();
  }, [user?.id]);

  return (
    <EducationContext.Provider
      value={{
        progress,
        wordStatuses,
        completedStages,
        educationScore,
        loading,
        loadProgress,
        updateProgress,
        completeCurrentStage,
        markWordAsKnown,
        markWordAsLearning,
        markWordsBatch,
        getLearningWordsForCurrentStage,
        getKnownWordsForCurrentStage,
        getAllWordsForCurrentStage,
        goToNextStep,
        resetToFirstStep,
        loadEducationScore,
        addEducationPoints,
        getStepPoints,
      }}
    >
      {children}
    </EducationContext.Provider>
  );
};
