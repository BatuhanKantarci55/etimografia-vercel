import { supabase } from "@lib/supabase";
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

// Profil tipi
type Profile = {
  id: string;
  username: string;
  avatar_index: number;
};

// Düello daveti tipi
export type DuelRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "expired";
  game_type: "multiple-choice" | "classic";
  direction: "old-to-new" | "new-to-old";
  difficulty: number[] | null;
  created_at: string;
  expires_at: string;
  sender?: Profile;
  receiver?: Profile;
};

// Düello oturumu tipi
export type DuelSession = {
  id: string;
  player1_id: string;
  player2_id: string;
  status: "waiting" | "countdown" | "ongoing" | "finished" | "abandoned";
  winner_id: string | null;
  game_type: "multiple-choice" | "classic";
  direction: "old-to-new" | "new-to-old";
  difficulty: number[] | null;
  player1_tower_pieces: number;
  player2_tower_pieces: number;
  countdown_started_at: string | null;
  created_at: string;
  finished_at: string | null;
  player1?: Profile;
  player2?: Profile;
};

// Düello istatistikleri tipi
export type DuelStats = {
  id: string;
  user_id: string;
  total_duels: number;
  wins: number;
  losses: number;
  draws: number;
  total_points: number;
  total_tower_pieces: number;
  updated_at: string;
};

// Düello geçmişi tipi
export type DuelHistory = {
  id: string;
  duel_session_id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string | null;
  player1_tower_pieces: number;
  player2_tower_pieces: number;
  player1_points: number;
  player2_points: number;
  played_at: string;
  player1?: Profile;
  player2?: Profile;
};

// Liderlik sıralaması tipi
export type LeaderboardEntry = {
  user_id: string;
  username: string;
  avatar_index: number;
  total_duels: number;
  wins: number;
  losses: number;
  draws: number;
  total_points: number;
  total_tower_pieces: number;
  win_rate: number;
  avg_points: number;
};

// Düello filtresi tipi
export type DuelFilters = {
  opponentId: string | null;
  gameType: "multiple-choice" | "classic" | null;
  direction: "old-to-new" | "new-to-old" | null;
  difficulty: number[] | null;
};

type DuelContextType = {
  pendingRequests: DuelRequest[];
  sentRequests: DuelRequest[];
  activeSession: DuelSession | null;
  filters: DuelFilters;
  setFilters: (filters: Partial<DuelFilters>) => void;
  clearFilters: () => void;
  clearActiveSession: () => void; // DEĞİŞİKLİK: Yeni fonksiyon eklendi
  sendInvite: (receiverId: string, filters: DuelFilters) => Promise<boolean>;
  cancelInvite: (requestId: string) => Promise<void>;
  acceptInvite: (requestId: string) => Promise<boolean>;
  rejectInvite: (requestId: string) => Promise<void>;
  submitAnswer: (sessionId: string, isCorrect: boolean) => Promise<void>;
  usePower: (sessionId: string) => Promise<boolean>;
  endDuel: (
    sessionId: string,
    winnerId: string | null,
    finalPieces?: { player1: number; player2: number },
  ) => Promise<{ player1Points: number; player2Points: number }>;
  leaveDuel: (sessionId: string) => Promise<void>;

  // İstatistikler
  userStats: DuelStats | null;
  duelHistory: DuelHistory[];
  leaderboard: LeaderboardEntry[];
  fetchUserStats: () => Promise<void>;
  fetchDuelHistory: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;

  isLoading: boolean;
};

const DuelContext = createContext<DuelContextType>({
  pendingRequests: [],
  sentRequests: [],
  activeSession: null,
  filters: {
    opponentId: null,
    gameType: null,
    direction: null,
    difficulty: null,
  },
  setFilters: () => {},
  clearFilters: () => {},
  clearActiveSession: () => {}, // DEĞİŞİKLİK: Başlangıç değeri
  sendInvite: async () => false,
  cancelInvite: async () => {},
  acceptInvite: async () => false,
  rejectInvite: async () => {},
  submitAnswer: async () => {},
  usePower: async () => false,
  endDuel: async () => ({ player1Points: 0, player2Points: 0 }),
  leaveDuel: async () => {},

  userStats: null,
  duelHistory: [],
  leaderboard: [],
  fetchUserStats: async () => {},
  fetchDuelHistory: async () => {},
  fetchLeaderboard: async () => {},

  isLoading: false,
});

export const useDuel = () => useContext(DuelContext);

export const DuelProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  const [pendingRequests, setPendingRequests] = useState<DuelRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<DuelRequest[]>([]);
  const [activeSession, setActiveSession] = useState<DuelSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // İstatistikler
  const [userStats, setUserStats] = useState<DuelStats | null>(null);
  const [duelHistory, setDuelHistory] = useState<DuelHistory[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [filters, setFiltersState] = useState<DuelFilters>({
    opponentId: null,
    gameType: null,
    direction: null,
    difficulty: null,
  });

  const invitesChannel = useRef<RealtimeChannel | null>(null);
  const sessionsChannel = useRef<RealtimeChannel | null>(null);
  const sessionChannel = useRef<RealtimeChannel | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEndingDuel = useRef(false);
  const endedSessions = useRef<Set<string>>(new Set());
  const gameEndTriggered = useRef<Set<string>>(new Set());

  const setFilters = useCallback((newFilters: Partial<DuelFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({
      opponentId: null,
      gameType: null,
      direction: null,
      difficulty: null,
    });
  }, []);

  // DEĞİŞİKLİK: Aktif oturumu temizleyen fonksiyon
  const clearActiveSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  // Kullanıcı istatistiklerini getir
  const fetchUserStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("duel_stats")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setUserStats(data);
      } else {
        // Varsayılan istatistikler
        setUserStats({
          id: "",
          user_id: user.id,
          total_duels: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          total_points: 0,
          total_tower_pieces: 0,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("İstatistikler getirilirken hata:", error);
    }
  }, [user]);

  // Düello geçmişini getir
  const fetchDuelHistory = useCallback(async () => {
    if (!user) return;

    try {
      // Önce geçmiş kayıtları getir
      const { data: historyData, error: historyError } = await supabase
        .from("duel_history")
        .select("*")
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .order("played_at", { ascending: false })
        .limit(20);

      if (historyError) throw historyError;

      if (!historyData || historyData.length === 0) {
        setDuelHistory([]);
        return;
      }

      // Profil bilgilerini ayrı ayrı getir
      const historyWithProfiles = await Promise.all(
        historyData.map(async (item) => {
          const [player1Res, player2Res] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, username, avatar_index")
              .eq("id", item.player1_id)
              .single(),
            supabase
              .from("profiles")
              .select("id, username, avatar_index")
              .eq("id", item.player2_id)
              .single(),
          ]);

          return {
            ...item,
            player1: player1Res.data || undefined,
            player2: player2Res.data || undefined,
          };
        }),
      );

      setDuelHistory(historyWithProfiles);
    } catch (error) {
      console.error("Düello geçmişi getirilirken hata:", error);
    }
  }, [user]);

  // Liderlik tablosunu getir
  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .limit(100);

      if (error) throw error;

      setLeaderboard(data || []);
    } catch (error) {
      console.error("Liderlik tablosu getirilirken hata:", error);
    }
  }, []);

  // Puan hesapla
  const calculatePoints = (
    towerPieces: number,
    isWinner: boolean,
    isLoser: boolean,
  ): number => {
    const winLossPoints = isWinner ? 30 : isLoser ? -15 : 0;
    const towerBonus = towerPieces * 1;
    return winLossPoints + towerBonus;
  };

  // İstatistikleri güncelle
  const updateStats = useCallback(
    async (
      player1Id: string,
      player2Id: string,
      winnerId: string | null,
      player1Pieces: number,
      player2Pieces: number,
      player1Points: number,
      player2Points: number,
    ) => {
      try {
        // Her iki oyuncu için istatistikleri güncelle
        for (const playerId of [player1Id, player2Id]) {
          const isPlayer1 = playerId === player1Id;
          const points = isPlayer1 ? player1Points : player2Points;
          const pieces = isPlayer1 ? player1Pieces : player2Pieces;
          const isWinner = winnerId === playerId;
          const isLoser = winnerId !== null && winnerId !== playerId;
          const isDraw = winnerId === null;

          // Mevcut istatistikleri getir
          const { data: existingStats } = await supabase
            .from("duel_stats")
            .select("*")
            .eq("user_id", playerId)
            .single();

          if (existingStats) {
            // Güncelle
            const updates: any = {
              total_duels: existingStats.total_duels + 1,
              total_points: existingStats.total_points + points,
              total_tower_pieces: existingStats.total_tower_pieces + pieces,
              updated_at: new Date().toISOString(),
            };

            if (isWinner) {
              updates.wins = existingStats.wins + 1;
              updates.losses = existingStats.losses;
              updates.draws = existingStats.draws;
            } else if (isLoser) {
              updates.wins = existingStats.wins;
              updates.losses = existingStats.losses + 1;
              updates.draws = existingStats.draws;
            } else if (isDraw) {
              updates.wins = existingStats.wins;
              updates.losses = existingStats.losses;
              updates.draws = existingStats.draws + 1;
            }

            await supabase
              .from("duel_stats")
              .update(updates)
              .eq("user_id", playerId);
          } else {
            // Yeni kayıt oluştur
            const newStats: any = {
              user_id: playerId,
              total_duels: 1,
              total_points: points,
              total_tower_pieces: pieces,
              updated_at: new Date().toISOString(),
            };

            if (isWinner) {
              newStats.wins = 1;
              newStats.losses = 0;
              newStats.draws = 0;
            } else if (isLoser) {
              newStats.wins = 0;
              newStats.losses = 1;
              newStats.draws = 0;
            } else if (isDraw) {
              newStats.wins = 0;
              newStats.losses = 0;
              newStats.draws = 1;
            }

            await supabase.from("duel_stats").insert(newStats);
          }
        }

        // Kullanıcı istatistiklerini yenile
        await fetchUserStats();
        await fetchLeaderboard();
      } catch (error) {
        console.error("İstatistikler güncellenirken hata:", error);
      }
    },
    [fetchUserStats, fetchLeaderboard],
  );

  // Davet gönder
  const sendInvite = useCallback(
    async (
      receiverId: string,
      inviteFilters: DuelFilters,
    ): Promise<boolean> => {
      if (!user) return false;

      setIsLoading(true);
      try {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + 120);

        const { data: insertData, error: insertError } = await supabase
          .from("duel_requests")
          .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            status: "pending",
            game_type: inviteFilters.gameType,
            direction: inviteFilters.direction,
            difficulty: inviteFilters.difficulty,
            expires_at: expiresAt.toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const { data: senderData } = await supabase
          .from("profiles")
          .select("id, username, avatar_index")
          .eq("id", user.id)
          .single();

        const requestWithSender = {
          ...insertData,
          sender: senderData || undefined,
        };

        setSentRequests((prev) => [requestWithSender as DuelRequest, ...prev]);
        return true;
      } catch (error) {
        console.error("Davet gönderilirken hata:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  // DEĞİŞİKLİK: Daveti veritabanından tamamen silecek (iptal edilecek) fonksiyon
  const cancelInvite = useCallback(
    async (requestId: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("duel_requests")
          .delete() // Status'ü cancelled yapmak yerine satırı tamamen siliyoruz
          .eq("id", requestId)
          .eq("sender_id", user.id);

        if (error) throw error;

        setSentRequests((prev) => prev.filter((req) => req.id !== requestId));
      } catch (error) {
        console.error("Davet iptal edilirken hata:", error);
      }
    },
    [user],
  );

  // Daveti kabul et
  const acceptInvite = useCallback(
    async (requestId: string): Promise<boolean> => {
      if (!user) return false;

      setIsLoading(true);
      try {
        const { error: updateError } = await supabase
          .from("duel_requests")
          .update({ status: "accepted" })
          .eq("id", requestId)
          .eq("receiver_id", user.id);

        if (updateError) throw updateError;

        const { data: request } = await supabase
          .from("duel_requests")
          .select("*")
          .eq("id", requestId)
          .single();

        if (!request) throw new Error("Davet bulunamadı");

        const now = new Date().toISOString();

        // Direkt "ongoing" olarak başlat
        const { data: session, error: sessionError } = await supabase
          .from("duel_sessions")
          .insert({
            player1_id: request.sender_id,
            player2_id: request.receiver_id,
            status: "ongoing",
            game_type: request.game_type,
            direction: request.direction,
            difficulty: request.difficulty,
            player1_tower_pieces: 0,
            player2_tower_pieces: 0,
            countdown_started_at: now,
            created_at: now,
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        // Profil bilgilerini getir
        const [player1Res, player2Res] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, username, avatar_index")
            .eq("id", session.player1_id)
            .single(),
          supabase
            .from("profiles")
            .select("id, username, avatar_index")
            .eq("id", session.player2_id)
            .single(),
        ]);

        const sessionWithProfiles = {
          ...session,
          player1: player1Res.data || undefined,
          player2: player2Res.data || undefined,
        };

        setActiveSession(sessionWithProfiles as DuelSession);
        return true;
      } catch (error) {
        console.error("Davet kabul edilirken hata:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  // Daveti reddet
  const rejectInvite = useCallback(
    async (requestId: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("duel_requests")
          .update({ status: "rejected" })
          .eq("id", requestId)
          .eq("receiver_id", user.id);

        if (error) throw error;

        setPendingRequests((prev) =>
          prev.filter((req) => req.id !== requestId),
        );
      } catch (error) {
        console.error("Davet reddedilirken hata:", error);
      }
    },
    [user],
  );

  // Cevap gönder
  const submitAnswer = useCallback(
    async (sessionId: string, isCorrect: boolean) => {
      if (!user || !activeSession) return;

      try {
        const isPlayer1 = user.id === activeSession.player1_id;

        const currentPieces = isPlayer1
          ? activeSession.player1_tower_pieces
          : activeSession.player2_tower_pieces;
        const newPieces = currentPieces + (isCorrect ? 1 : 0);

        console.log(
          `📤 Cevap gönderiliyor - Oyuncu: ${isPlayer1 ? "P1" : "P2"}, Doğru: ${isCorrect}, Parça: ${currentPieces} -> ${newPieces}`,
        );

        const updates: any = {};

        if (isPlayer1) {
          updates.player1_tower_pieces = newPieces;
        } else {
          updates.player2_tower_pieces = newPieces;
        }

        const { error } = await supabase
          .from("duel_sessions")
          .update(updates)
          .eq("id", sessionId);

        if (error) throw error;

        // Local state'i de güncelle
        setActiveSession((prev) => {
          if (!prev) return null;
          const updated = {
            ...prev,
            player1_tower_pieces: isPlayer1
              ? newPieces
              : prev.player1_tower_pieces,
            player2_tower_pieces: !isPlayer1
              ? newPieces
              : prev.player2_tower_pieces,
          };
          return updated;
        });
      } catch (error) {
        console.error("Cevap gönderilirken hata:", error);
      }
    },
    [user, activeSession],
  );

  // Özel güç kullan
  const usePower = useCallback(
    async (sessionId: string): Promise<boolean> => {
      if (!user || !activeSession) return false;

      try {
        const isPlayer1 = user.id === activeSession.player1_id;
        const opponentTower = isPlayer1
          ? activeSession.player2_tower_pieces
          : activeSession.player1_tower_pieces;

        if (opponentTower === 0) return false;

        const updates: any = {};

        if (isPlayer1) {
          updates.player2_tower_pieces = opponentTower - 1;
        } else {
          updates.player1_tower_pieces = opponentTower - 1;
        }

        const { error } = await supabase
          .from("duel_sessions")
          .update(updates)
          .eq("id", sessionId);

        if (error) throw error;

        // Local state'i de güncelle
        setActiveSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            player1_tower_pieces: !isPlayer1
              ? updates.player1_tower_pieces
              : prev.player1_tower_pieces,
            player2_tower_pieces: isPlayer1
              ? updates.player2_tower_pieces
              : prev.player2_tower_pieces,
          };
        });

        return true;
      } catch (error) {
        console.error("Özel güç kullanılırken hata:", error);
        return false;
      }
    },
    [user, activeSession],
  );

  // Düelloyu sonlandır
  const endDuel = useCallback(
    async (
      sessionId: string,
      winnerId: string | null,
      finalPieces?: { player1: number; player2: number },
    ): Promise<{ player1Points: number; player2Points: number }> => {
      if (!user || !activeSession) {
        console.log("❌ endDuel: user veya activeSession yok");
        return { player1Points: 0, player2Points: 0 };
      }

      // Daha önce sonlandırıldı mı kontrol et
      if (endedSessions.current.has(sessionId)) {
        console.log("⚠️ endDuel: Bu oturum daha önce sonlandırıldı");
        return { player1Points: 0, player2Points: 0 };
      }

      if (isEndingDuel.current) {
        console.log("⚠️ endDuel: Düello zaten sonlandırılıyor...");
        return { player1Points: 0, player2Points: 0 };
      }

      isEndingDuel.current = true;

      try {
        // Parça sayılarını belirle
        const player1Pieces =
          finalPieces?.player1 ?? activeSession.player1_tower_pieces;
        const player2Pieces =
          finalPieces?.player2 ?? activeSession.player2_tower_pieces;

        console.log(
          `🏁 Düello sonlandırılıyor - Parçalar: P1=${player1Pieces}, P2=${player2Pieces}, Kazanan: ${winnerId || "Berabere"}`,
        );

        // Yeni puan hesaplama
        const isPlayer1Winner = winnerId === activeSession.player1_id;
        const isPlayer2Winner = winnerId === activeSession.player2_id;
        const isPlayer1Loser =
          winnerId !== null && winnerId !== activeSession.player1_id;
        const isPlayer2Loser =
          winnerId !== null && winnerId !== activeSession.player2_id;

        const player1Points = calculatePoints(
          player1Pieces,
          isPlayer1Winner,
          isPlayer1Loser,
        );
        const player2Points = calculatePoints(
          player2Pieces,
          isPlayer2Winner,
          isPlayer2Loser,
        );

        console.log(`💰 Puan hesaplama:
          Oyuncu 1: ${player1Pieces} parça, ${isPlayer1Winner ? "kazandı" : isPlayer1Loser ? "kaybetti" : "berabere"} -> ${player1Points} puan
          Oyuncu 2: ${player2Pieces} parça, ${isPlayer2Winner ? "kazandı" : isPlayer2Loser ? "kaybetti" : "berabere"} -> ${player2Points} puan
        `);

        // Düello oturumunu güncelle
        const { error: sessionError } = await supabase
          .from("duel_sessions")
          .update({
            status: "finished",
            winner_id: winnerId,
            finished_at: new Date().toISOString(),
            player1_tower_pieces: player1Pieces,
            player2_tower_pieces: player2Pieces,
          })
          .eq("id", sessionId);

        if (sessionError) throw sessionError;

        // Düello geçmişine ekle
        const { error: historyError } = await supabase
          .from("duel_history")
          .insert({
            duel_session_id: sessionId,
            player1_id: activeSession.player1_id,
            player2_id: activeSession.player2_id,
            winner_id: winnerId,
            player1_tower_pieces: player1Pieces,
            player2_tower_pieces: player2Pieces,
            player1_points: player1Points,
            player2_points: player2Points,
            played_at: new Date().toISOString(),
          });

        if (historyError) {
          console.error("Geçmiş eklenirken hata:", historyError);
          throw historyError;
        }

        // İstatistikleri güncelle
        await updateStats(
          activeSession.player1_id,
          activeSession.player2_id,
          winnerId,
          player1Pieces,
          player2Pieces,
          player1Points,
          player2Points,
        );

        // Düello geçmişini yenile
        await fetchDuelHistory();

        // Bu oturumu sonlandırıldı olarak işaretle
        endedSessions.current.add(sessionId);
        gameEndTriggered.current.add(sessionId);

        return { player1Points, player2Points };
      } catch (error) {
        console.error("Düello sonlandırılırken hata:", error);
        return { player1Points: 0, player2Points: 0 };
      } finally {
        setTimeout(() => {
          isEndingDuel.current = false;
        }, 1000);
      }
    },
    [user, activeSession, updateStats, fetchDuelHistory],
  );

  // Düellodan ayrıl
  const leaveDuel = useCallback(
    async (sessionId: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("duel_sessions")
          .update({
            status: "abandoned",
            finished_at: new Date().toISOString(),
          })
          .eq("id", sessionId);

        if (error) throw error;

        setActiveSession(null);
      } catch (error) {
        console.error("Düellodan ayrılırken hata:", error);
      }
    },
    [user],
  );

  // Geri sayım kontrolü
  useEffect(() => {
    if (!activeSession) return;

    if (
      activeSession.status === "countdown" &&
      activeSession.countdown_started_at
    ) {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }

      const countdownStarted = new Date(
        activeSession.countdown_started_at,
      ).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - countdownStarted) / 1000);
      const remainingTime = Math.max(0, 3 - elapsed);

      if (elapsed >= 3) {
        supabase
          .from("duel_sessions")
          .update({ status: "ongoing" })
          .eq("id", activeSession.id)
          .then(({ error }) => {
            if (error) console.error("Oyun başlatılamadı:", error);
          });
      } else {
        const waitTime = (3 - elapsed) * 1000;
        countdownTimerRef.current = setTimeout(() => {
          supabase
            .from("duel_sessions")
            .update({ status: "ongoing" })
            .eq("id", activeSession.id)
            .then(({ error }) => {
              if (error) console.error("Oyun başlatılamadı:", error);
            });
        }, waitTime);
      }
    }

    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [
    activeSession?.id,
    activeSession?.status,
    activeSession?.countdown_started_at,
  ]);

  // Tüm düello oturumlarını dinle
  const listenForSessions = useCallback(() => {
    if (!user) return;

    if (sessionsChannel.current) {
      sessionsChannel.current.unsubscribe();
    }

    sessionsChannel.current = supabase
      .channel("all-duel-sessions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "duel_sessions",
          filter: `player1_id=eq.${user.id}`,
        },
        async (payload) => {
          const newSession = payload.new as DuelSession;

          const [player1Res, player2Res] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, username, avatar_index")
              .eq("id", newSession.player1_id)
              .single(),
            supabase
              .from("profiles")
              .select("id, username, avatar_index")
              .eq("id", newSession.player2_id)
              .single(),
          ]);

          const sessionWithProfiles = {
            ...newSession,
            player1: player1Res.data || undefined,
            player2: player2Res.data || undefined,
          };

          setActiveSession(sessionWithProfiles as DuelSession);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "duel_sessions",
          filter: `player2_id=eq.${user.id}`,
        },
        async (payload) => {
          const newSession = payload.new as DuelSession;

          const [player1Res, player2Res] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, username, avatar_index")
              .eq("id", newSession.player1_id)
              .single(),
            supabase
              .from("profiles")
              .select("id, username, avatar_index")
              .eq("id", newSession.player2_id)
              .single(),
          ]);

          const sessionWithProfiles = {
            ...newSession,
            player1: player1Res.data || undefined,
            player2: player2Res.data || undefined,
          };

          setActiveSession(sessionWithProfiles as DuelSession);
        },
      )
      .subscribe();
  }, [user]);

  // Aktif session değiştiğinde güncellemeleri dinle
  const listenForSessionUpdates = useCallback(() => {
    if (!activeSession || !user) return;

    if (sessionChannel.current) {
      sessionChannel.current.unsubscribe();
    }

    console.log(`🔔 Session dinleyici başlatılıyor: ${activeSession.id}`);

    sessionChannel.current = supabase
      .channel(`duel-session-${activeSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "duel_sessions",
          filter: `id=eq.${activeSession.id}`,
        },
        (payload) => {
          const updated = payload.new as DuelSession;

          console.log("🔄 Session güncellendi:", {
            status: updated.status,
            winner_id: updated.winner_id,
            pieces: `${updated.player1_tower_pieces}-${updated.player2_tower_pieces}`,
            finished_at: updated.finished_at,
          });

          // Eğer session "finished" olduysa ve bu tarafta henüz bitirilmemişse
          if (
            updated.status === "finished" &&
            !gameEndTriggered.current.has(activeSession.id)
          ) {
            console.log("🏁 Karşı taraf oyunu bitirdi, biz de bitiriyoruz...");

            // Bu oturumu tetiklendi olarak işaretle
            gameEndTriggered.current.add(activeSession.id);
          }

          // Normal güncelleme
          setActiveSession((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              player1_tower_pieces: updated.player1_tower_pieces,
              player2_tower_pieces: updated.player2_tower_pieces,
              status: updated.status,
              winner_id: updated.winner_id,
              finished_at: updated.finished_at,
            };
          });
        },
      )
      .subscribe();
  }, [activeSession, user]);

  // Davetleri dinle
  const listenForInvites = useCallback(() => {
    if (!user) return;

    if (invitesChannel.current) {
      invitesChannel.current.unsubscribe();
    }

    invitesChannel.current = supabase
      .channel("duel-invites")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "duel_requests",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const newRequest = payload.new as DuelRequest;
          const { data: sender } = await supabase
            .from("profiles")
            .select("id, username, avatar_index")
            .eq("id", newRequest.sender_id)
            .single();
          const requestWithSender = {
            ...newRequest,
            sender: sender || undefined,
          };
          setPendingRequests((prev) => [requestWithSender, ...prev]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "duel_requests",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          setPendingRequests((prev) =>
            prev.filter((req) => req.id !== payload.new.id),
          );
        },
      )
      .subscribe();
  }, [user]);

  // Ana dinleyiciler
  useEffect(() => {
    if (user) {
      listenForInvites();
      listenForSessions();
      fetchUserStats();
      fetchDuelHistory();
      fetchLeaderboard();
    }

    return () => {
      if (invitesChannel.current) invitesChannel.current.unsubscribe();
      if (sessionsChannel.current) sessionsChannel.current.unsubscribe();
      if (sessionChannel.current) sessionChannel.current.unsubscribe();
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, [
    user,
    listenForInvites,
    listenForSessions,
    fetchUserStats,
    fetchDuelHistory,
    fetchLeaderboard,
  ]);

  // Aktif session değiştiğinde güncellemeleri dinle
  useEffect(() => {
    if (activeSession) {
      listenForSessionUpdates();
    }
    return () => {
      if (sessionChannel.current) sessionChannel.current.unsubscribe();
    };
  }, [activeSession, listenForSessionUpdates]);

  return (
    <DuelContext.Provider
      value={{
        pendingRequests,
        sentRequests,
        activeSession,
        filters,
        setFilters,
        clearFilters,
        clearActiveSession, // DEĞİŞİKLİK: Provider'a aktarıldı
        sendInvite,
        cancelInvite,
        acceptInvite,
        rejectInvite,
        submitAnswer,
        usePower,
        endDuel,
        leaveDuel,

        userStats,
        duelHistory,
        leaderboard,
        fetchUserStats,
        fetchDuelHistory,
        fetchLeaderboard,

        isLoading,
      }}
    >
      {children}
    </DuelContext.Provider>
  );
};
