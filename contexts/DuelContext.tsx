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
  clearActiveSession: () => void;
  sendInvite: (receiverId: string, filters: DuelFilters) => Promise<boolean>;
  cancelInvite: (requestId: string) => Promise<void>;
  acceptInvite: (requestId: string) => Promise<boolean>;
  rejectInvite: (requestId: string) => Promise<void>;
  submitAnswer: (sessionId: string, isCorrect: boolean) => Promise<void>;
  usePower: (sessionId: string) => Promise<boolean>;
  endDuel: (
    sessionId: string,
    winnerId?: string | null,
  ) => Promise<{
    player1Points: number;
    player2Points: number;
    actualWinnerId: string | null;
    actualPlayer1Pieces: number;
    actualPlayer2Pieces: number;
  }>;
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
  clearActiveSession: () => {},
  sendInvite: async () => false,
  cancelInvite: async () => {},
  acceptInvite: async () => false,
  rejectInvite: async () => {},
  submitAnswer: async () => {},
  usePower: async () => false,
  endDuel: async () => ({
    player1Points: 0,
    player2Points: 0,
    actualWinnerId: null,
    actualPlayer1Pieces: 0,
    actualPlayer2Pieces: 0,
  }),
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

  // Yarış Durumu (Race Condition) önleyicileri
  const isEndingDuel = useRef(false);
  const endedSessions = useRef<Set<string>>(new Set());

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

  const clearActiveSession = useCallback(() => {
    setActiveSession(null);
  }, []);

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

  const fetchDuelHistory = useCallback(async () => {
    if (!user) return;
    try {
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

  const calculatePoints = (
    towerPieces: number,
    isWinner: boolean,
    isLoser: boolean,
  ): number => {
    const winLossPoints = isWinner ? 30 : isLoser ? -15 : 0;
    const towerBonus = towerPieces * 1;
    return winLossPoints + towerBonus;
  };

  // DÜZELTME 1: updateStats fonksiyonu ARTIK SADECE GEÇERLİ KULLANICIYI günceller.
  // Çift puan ekleme sorunu çözülmüş ve RLS kısıtlamalarına tam uyumlu hale getirilmiştir.
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
        const playerId = user?.id;
        if (!playerId) return;

        // Yalnızca geçerli kullanıcının değerlerini ayıklıyoruz
        const isPlayer1 = playerId === player1Id;
        const points = isPlayer1 ? player1Points : player2Points;
        const pieces = isPlayer1 ? player1Pieces : player2Pieces;
        const isWinner = winnerId === playerId;
        const isLoser = winnerId !== null && winnerId !== playerId;
        const isDraw = winnerId === null;

        const { data: existingStats } = await supabase
          .from("duel_stats")
          .select("*")
          .eq("user_id", playerId)
          .single();

        if (existingStats) {
          const updates: any = {
            total_duels: existingStats.total_duels + 1,
            total_points: existingStats.total_points + points,
            total_tower_pieces: existingStats.total_tower_pieces + pieces,
            updated_at: new Date().toISOString(),
          };

          if (isWinner) {
            updates.wins = existingStats.wins + 1;
          } else if (isLoser) {
            updates.losses = existingStats.losses + 1;
          } else if (isDraw) {
            updates.draws = existingStats.draws + 1;
          }
          await supabase
            .from("duel_stats")
            .update(updates)
            .eq("user_id", playerId);
        } else {
          const newStats: any = {
            user_id: playerId,
            total_duels: 1,
            total_points: points,
            total_tower_pieces: pieces,
            updated_at: new Date().toISOString(),
            wins: isWinner ? 1 : 0,
            losses: isLoser ? 1 : 0,
            draws: isDraw ? 1 : 0,
          };
          await supabase.from("duel_stats").insert(newStats);
        }

        const { data: arenaProgress } = await supabase
          .from("user_arena_progress")
          .select("*")
          .eq("user_id", playerId)
          .single();
        if (arenaProgress) {
          const newTrophies = Math.max(
            0,
            arenaProgress.current_trophies + points,
          );
          await supabase
            .from("user_arena_progress")
            .update({
              current_trophies: newTrophies,
              highest_trophies: Math.max(
                arenaProgress.highest_trophies,
                newTrophies,
              ),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", playerId);
        } else {
          await supabase.from("user_arena_progress").insert({
            user_id: playerId,
            current_arena_id: 1,
            current_trophies: Math.max(0, points),
            highest_trophies: Math.max(0, points),
            updated_at: new Date().toISOString(),
          });
        }

        await fetchUserStats();
        await fetchLeaderboard();
      } catch (error) {
        console.error("İstatistikler güncellenirken hata:", error);
      }
    },
    [user, fetchUserStats, fetchLeaderboard],
  );

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

  const cancelInvite = useCallback(
    async (requestId: string) => {
      if (!user) return;
      try {
        const { error } = await supabase
          .from("duel_requests")
          .delete()
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

  const submitAnswer = useCallback(
    async (sessionId: string, isCorrect: boolean) => {
      if (!user || !activeSession) return;
      try {
        const isPlayer1 = user.id === activeSession.player1_id;
        const currentPieces = isPlayer1
          ? activeSession.player1_tower_pieces
          : activeSession.player2_tower_pieces;
        const newPieces = currentPieces + (isCorrect ? 1 : 0);
        const updates: any = {};
        if (isPlayer1) updates.player1_tower_pieces = newPieces;
        else updates.player2_tower_pieces = newPieces;

        const { error } = await supabase
          .from("duel_sessions")
          .update(updates)
          .eq("id", sessionId);
        if (error) throw error;

        setActiveSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            player1_tower_pieces: isPlayer1
              ? newPieces
              : prev.player1_tower_pieces,
            player2_tower_pieces: !isPlayer1
              ? newPieces
              : prev.player2_tower_pieces,
          };
        });
      } catch (error) {
        console.error("Cevap gönderilirken hata:", error);
      }
    },
    [user, activeSession],
  );

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
        if (isPlayer1) updates.player2_tower_pieces = opponentTower - 1;
        else updates.player1_tower_pieces = opponentTower - 1;

        const { error } = await supabase
          .from("duel_sessions")
          .update(updates)
          .eq("id", sessionId);
        if (error) throw error;

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

  // DÜZELTME 2: Sunucu otoritesi devrede. Kilitli (atomik) güncelleme yapılarak çifte history kaydı engellenir
  const endDuel = useCallback(
    async (
      sessionId: string,
      winnerId: string | null = null,
    ): Promise<{
      player1Points: number;
      player2Points: number;
      actualWinnerId: string | null;
      actualPlayer1Pieces: number;
      actualPlayer2Pieces: number;
    }> => {
      if (!user || !activeSession) {
        return {
          player1Points: 0,
          player2Points: 0,
          actualWinnerId: null,
          actualPlayer1Pieces: 0,
          actualPlayer2Pieces: 0,
        };
      }

      if (endedSessions.current.has(sessionId)) {
        return {
          player1Points: 0,
          player2Points: 0,
          actualWinnerId: null,
          actualPlayer1Pieces: 0,
          actualPlayer2Pieces: 0,
        };
      }

      if (isEndingDuel.current) {
        return {
          player1Points: 0,
          player2Points: 0,
          actualWinnerId: null,
          actualPlayer1Pieces: 0,
          actualPlayer2Pieces: 0,
        };
      }
      isEndingDuel.current = true;

      try {
        // Sunucudaki son kule parça durumlarını güvenli şekilde çekiyoruz
        const { data: dbSession, error: dbError } = await supabase
          .from("duel_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();
        if (dbError) throw dbError;

        let p1P = dbSession.player1_tower_pieces;
        let p2P = dbSession.player2_tower_pieces;
        let actualWinnerId = dbSession.winner_id;

        // Kazanan belli değilse son parçalara göre belirle
        if (dbSession.status !== "finished") {
          if (p1P > p2P) actualWinnerId = dbSession.player1_id;
          else if (p2P > p1P) actualWinnerId = dbSession.player2_id;
          else actualWinnerId = winnerId; // Ayrılma veya zaman dolması ihtimalleri için
        }

        const isP1Winner = actualWinnerId === dbSession.player1_id;
        const isP2Winner = actualWinnerId === dbSession.player2_id;
        const isP1Loser =
          actualWinnerId !== null && actualWinnerId !== dbSession.player1_id;
        const isP2Loser =
          actualWinnerId !== null && actualWinnerId !== dbSession.player2_id;

        const p1Points = calculatePoints(p1P, isP1Winner, isP1Loser);
        const p2Points = calculatePoints(p2P, isP2Winner, isP2Loser);

        // Eğer veritabanı "finished" olarak güncellenmişse, biz sadece kendi istatistiklerimizi alıyoruz
        if (dbSession.status === "finished") {
          await updateStats(
            dbSession.player1_id,
            dbSession.player2_id,
            actualWinnerId,
            p1P,
            p2P,
            p1Points,
            p2Points,
          );
          endedSessions.current.add(sessionId);
          return {
            player1Points: p1Points,
            player2Points: p2Points,
            actualWinnerId,
            actualPlayer1Pieces: p1P,
            actualPlayer2Pieces: p2P,
          };
        }

        // Eğer ilk bitiren cihazsak, durumu finished olarak kilitleyelim
        const { data: finalizedSession } = await supabase
          .from("duel_sessions")
          .update({
            status: "finished",
            winner_id: actualWinnerId,
            finished_at: new Date().toISOString(),
          })
          .eq("id", sessionId)
          .eq("status", "ongoing")
          .select()
          .maybeSingle();

        // Kilidi rakip bizden 1-2 ms önce aldıysa
        if (!finalizedSession) {
          const { data: latest } = await supabase
            .from("duel_sessions")
            .select("*")
            .eq("id", sessionId)
            .single();
          const l_winner = latest.winner_id;
          const l_p1P = latest.player1_tower_pieces;
          const l_p2P = latest.player2_tower_pieces;
          const l_p1Points = calculatePoints(
            l_p1P,
            l_winner === latest.player1_id,
            l_winner !== null && l_winner !== latest.player1_id,
          );
          const l_p2Points = calculatePoints(
            l_p2P,
            l_winner === latest.player2_id,
            l_winner !== null && l_winner !== latest.player2_id,
          );

          await updateStats(
            latest.player1_id,
            latest.player2_id,
            l_winner,
            l_p1P,
            l_p2P,
            l_p1Points,
            l_p2Points,
          );
          endedSessions.current.add(sessionId);
          return {
            player1Points: l_p1Points,
            player2Points: l_p2Points,
            actualWinnerId: l_winner,
            actualPlayer1Pieces: l_p1P,
            actualPlayer2Pieces: l_p2P,
          };
        }

        // Kilidi biz kazandık, bir adet History oluşturulacak
        const { data: existingHistory } = await supabase
          .from("duel_history")
          .select("id")
          .eq("duel_session_id", sessionId)
          .maybeSingle();

        if (!existingHistory) {
          await supabase.from("duel_history").insert({
            duel_session_id: sessionId,
            player1_id: dbSession.player1_id,
            player2_id: dbSession.player2_id,
            winner_id: actualWinnerId,
            player1_tower_pieces: p1P,
            player2_tower_pieces: p2P,
            player1_points: p1Points,
            player2_points: p2Points,
            played_at: new Date().toISOString(),
          });
        }

        await updateStats(
          dbSession.player1_id,
          dbSession.player2_id,
          actualWinnerId,
          p1P,
          p2P,
          p1Points,
          p2Points,
        );
        await fetchDuelHistory();

        endedSessions.current.add(sessionId);
        return {
          player1Points: p1Points,
          player2Points: p2Points,
          actualWinnerId,
          actualPlayer1Pieces: p1P,
          actualPlayer2Pieces: p2P,
        };
      } catch (error) {
        console.error("Düello sonlandırılırken hata:", error);
        return {
          player1Points: 0,
          player2Points: 0,
          actualWinnerId: null,
          actualPlayer1Pieces: 0,
          actualPlayer2Pieces: 0,
        };
      } finally {
        setTimeout(() => {
          isEndingDuel.current = false;
        }, 500);
      }
    },
    [user, activeSession, updateStats, fetchDuelHistory],
  );

  const leaveDuel = useCallback(
    async (sessionId: string) => {
      if (!user || !activeSession) return;
      try {
        const isPlayer1 = user.id === activeSession.player1_id;
        const opponentId = isPlayer1
          ? activeSession.player2_id
          : activeSession.player1_id;

        // Terk eden kişi karşı tarafın otomatik kazandığını bildirir
        await endDuel(sessionId, opponentId);

        setActiveSession(null);
      } catch (error) {
        console.error("Düellodan ayrılırken hata:", error);
      }
    },
    [user, activeSession, endDuel],
  );

  useEffect(() => {
    if (!activeSession) return;

    if (
      activeSession.status === "countdown" &&
      activeSession.countdown_started_at
    ) {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);

      const countdownStarted = new Date(
        activeSession.countdown_started_at,
      ).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - countdownStarted) / 1000);

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
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, [
    activeSession?.id,
    activeSession?.status,
    activeSession?.countdown_started_at,
  ]);

  const listenForSessions = useCallback(() => {
    if (!user) return;
    if (sessionsChannel.current) sessionsChannel.current.unsubscribe();

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

  const listenForSessionUpdates = useCallback(() => {
    if (!activeSession || !user) return;
    if (sessionChannel.current) sessionChannel.current.unsubscribe();

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

          // Karşı taraf veya biz bir işlem yaptığımızda durumu (state'i) güncelliyoruz.
          // Eğer durum "finished" olduysa, session.tsx bunu fark edip handleGameEnd() çağıracak.
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

  const listenForInvites = useCallback(() => {
    if (!user) return;
    if (invitesChannel.current) invitesChannel.current.unsubscribe();

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
        clearActiveSession,
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
