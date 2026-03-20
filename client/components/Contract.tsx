"use client";

import { useState, useCallback, useEffect } from "react";
import {
  earn,
  transfer,
  redeem,
  balance,
  totalEarned,
  totalRedeemed,
  CONTRACT_ADDRESS,
  connectWallet,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12" />
      <path d="M15 9.5a3 3 0 0 0-3-2.5H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H9a3 3 0 0 1-3-2.5" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22 11 13 2 9l20-7" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#fbbf24]/30 focus-within:shadow-[0_0_20px_rgba(251,191,36,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Points Badge ─────────────────────────────────────────────

function PointsChip({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <span className="font-mono text-2xl font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-white/25">{label}</span>
    </div>
  );
}

// ── Action Point Config ──────────────────────────────────────

const ACTION_CONFIG: Record<string, { points: number; color: string; bg: string; description: string }> = {
  purchase: { points: 100, color: "#34d399", bg: "bg-[#34d399]/10", description: "Buy something" },
  referral:  { points: 200, color: "#fbbf24", bg: "bg-[#fbbf24]/10", description: "Refer a friend" },
  review:    { points: 50,  color: "#4fc3f7", bg: "bg-[#4fc3f7]/10", description: "Write a review" },
  signup:    { points: 10,  color: "#7c6cf0", bg: "bg-[#7c6cf0]/10", description: "Sign up" },
};

// ── Main Component ──────────────────────────────────────────

type Tab = "dashboard" | "earn" | "transfer" | "redeem";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Earn
  const [selectedAction, setSelectedAction] = useState<string>("purchase");
  const [isEarning, setIsEarning] = useState(false);

  // Transfer
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Redeem
  const [redeemAmount, setRedeemAmount] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Dashboard data
  const [myBalance, setMyBalance] = useState<bigint | null>(null);
  const [myEarned, setMyEarned] = useState<bigint | null>(null);
  const [myRedeemed, setMyRedeemed] = useState<bigint | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const loadStats = useCallback(async (address: string) => {
    setIsLoadingStats(true);
    try {
      const [b, e, r] = await Promise.all([
        balance(address),
        totalEarned(address),
        totalRedeemed(address),
      ]);
      setMyBalance(b !== null ? BigInt(b) : BigInt(0));
      setMyEarned(e !== null ? BigInt(e) : BigInt(0));
      setMyRedeemed(r !== null ? BigInt(r) : BigInt(0));
    } catch {
      // silently fail on read
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (walletAddress) {
      loadStats(walletAddress);
    }
  }, [walletAddress, loadStats]);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleEarn = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    setError(null);
    setIsEarning(true);
    setTxStatus("Awaiting signature...");
    try {
      await earn(walletAddress, selectedAction);
      setTxStatus(`Earned ${ACTION_CONFIG[selectedAction].points} points for "${selectedAction}"!`);
      await loadStats(walletAddress);
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsEarning(false);
    }
  }, [walletAddress, selectedAction, loadStats]);

  const handleTransfer = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!transferTo.trim()) return setError("Enter a recipient address");
    if (!transferAmount || parseInt(transferAmount) <= 0) return setError("Enter a valid amount");
    setError(null);
    setIsTransferring(true);
    setTxStatus("Awaiting signature...");
    try {
      await transfer(walletAddress, transferTo.trim(), parseInt(transferAmount));
      setTxStatus(`Sent ${transferAmount} points to ${truncate(transferTo.trim())}!`);
      await loadStats(walletAddress);
      setTransferTo("");
      setTransferAmount("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsTransferring(false);
    }
  }, [walletAddress, transferTo, transferAmount, loadStats]);

  const handleRedeem = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!redeemAmount || parseInt(redeemAmount) <= 0) return setError("Enter a valid amount");
    setError(null);
    setIsRedeeming(true);
    setTxStatus("Awaiting signature...");
    try {
      await redeem(walletAddress, parseInt(redeemAmount));
      setTxStatus(`Redeemed ${redeemAmount} points!`);
      await loadStats(walletAddress);
      setRedeemAmount("");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsRedeeming(false);
    }
  }, [walletAddress, redeemAmount, loadStats]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: <StarIcon />, color: "#fbbf24" },
    { key: "earn",      label: "Earn",      icon: <CoinIcon />,   color: "#34d399" },
    { key: "transfer",  label: "Transfer",  icon: <SendIcon />,   color: "#4fc3f7" },
    { key: "redeem",    label: "Redeem",    icon: <GiftIcon />,   color: "#7c6cf0" },
  ];

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("!") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#fbbf24]/20 to-[#7c6cf0]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#fbbf24]">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v12" />
                  <path d="M15 9.5a3 3 0 0 0-3-2.5H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H9a3 3 0 0 1-3-2.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Loyalty Points</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {walletAddress ? (
                <Badge variant="success" className="text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] animate-pulse" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[10px]">Disconnected</Badge>
              )}
              <Badge variant="info" className="text-[10px]">Soroban</Badge>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Dashboard */}
            {activeTab === "dashboard" && (
              <div className="space-y-5">
                {!walletAddress ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <p className="text-sm text-white/40">Connect your wallet to view your loyalty stats</p>
                    <ShimmerButton onClick={onConnect} shimmerColor="#fbbf24" className="px-8">
                      {isConnecting ? <><SpinnerIcon /> Connecting...</> : "Connect Wallet"}
                    </ShimmerButton>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <PointsChip
                        value={isLoadingStats ? "—" : myBalance?.toString() ?? "0"}
                        label="Balance"
                        color="#fbbf24"
                      />
                      <PointsChip
                        value={isLoadingStats ? "—" : myEarned?.toString() ?? "0"}
                        label="Earned"
                        color="#34d399"
                      />
                      <PointsChip
                        value={isLoadingStats ? "—" : myRedeemed?.toString() ?? "0"}
                        label="Redeemed"
                        color="#7c6cf0"
                      />
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/25 mb-3">How to Earn</p>
                      <div className="space-y-2">
                        {Object.entries(ACTION_CONFIG).map(([action, cfg]) => (
                          <div key={action} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.bg.replace("/10", ""))} style={{ backgroundColor: cfg.color }} />
                              <span className="text-xs text-white/60 capitalize">{action}</span>
                              <span className="text-[10px] text-white/25">— {cfg.description}</span>
                            </div>
                            <span className="font-mono text-xs font-bold" style={{ color: cfg.color }}>+{cfg.points}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                            <span className="text-xs text-white/60">Any other action</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-white/40">+10</span>
                        </div>
                      </div>
                    </div>

                    <ShimmerButton
                      onClick={() => { if (walletAddress) loadStats(walletAddress); }}
                      shimmerColor="#fbbf24"
                      className="w-full"
                    >
                      <RefreshIcon /> Refresh Stats
                    </ShimmerButton>
                  </>
                )}
              </div>
            )}

            {/* Earn */}
            {activeTab === "earn" && (
              <div className="space-y-5">
                {!walletAddress ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <p className="text-sm text-white/40">Connect your wallet to earn points</p>
                    <ShimmerButton onClick={onConnect} shimmerColor="#34d399" className="px-8">
                      {isConnecting ? <><SpinnerIcon /> Connecting...</> : "Connect Wallet"}
                    </ShimmerButton>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">Select Action</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(ACTION_CONFIG).map(([action, cfg]) => {
                          const active = selectedAction === action;
                          return (
                            <button
                              key={action}
                              onClick={() => setSelectedAction(action)}
                              className={cn(
                                "flex flex-col items-start gap-1 rounded-xl border p-3 transition-all active:scale-[0.98]",
                                active
                                  ? `${cfg.bg} border-${cfg.color}/30`
                                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
                              )}
                            >
                              <span className={cn("text-xs font-semibold capitalize", active ? "" : "text-white/50")} style={active ? { color: cfg.color } : undefined}>{action}</span>
                              <span className="font-mono text-lg font-bold" style={{ color: active ? cfg.color : "#ffffff30" }}>+{cfg.points}</span>
                              <span className="text-[10px] text-white/30">{cfg.description}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <ShimmerButton onClick={handleEarn} disabled={isEarning} shimmerColor="#34d399" className="w-full">
                      {isEarning ? <><SpinnerIcon /> Processing...</> : <><CoinIcon /> Earn Points</>}
                    </ShimmerButton>
                  </>
                )}
              </div>
            )}

            {/* Transfer */}
            {activeTab === "transfer" && (
              <div className="space-y-5">
                {!walletAddress ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <p className="text-sm text-white/40">Connect your wallet to transfer points</p>
                    <ShimmerButton onClick={onConnect} shimmerColor="#4fc3f7" className="px-8">
                      {isConnecting ? <><SpinnerIcon /> Connecting...</> : "Connect Wallet"}
                    </ShimmerButton>
                  </div>
                ) : (
                  <>
                    <Input
                      label="Recipient Address"
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      placeholder="G... or C..."
                    />
                    <Input
                      label="Amount"
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0"
                    />
                    {myBalance !== null && (
                      <button
                        onClick={() => setTransferAmount(myBalance.toString())}
                        className="text-[10px] text-[#4fc3f7]/50 hover:text-[#4fc3f7]/80 text-left transition-colors"
                      >
                        Send all ({myBalance.toString()} available)
                      </button>
                    )}
                    <ShimmerButton onClick={handleTransfer} disabled={isTransferring} shimmerColor="#4fc3f7" className="w-full">
                      {isTransferring ? <><SpinnerIcon /> Sending...</> : <><SendIcon /> Transfer Points</>}
                    </ShimmerButton>
                  </>
                )}
              </div>
            )}

            {/* Redeem */}
            {activeTab === "redeem" && (
              <div className="space-y-5">
                {!walletAddress ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <p className="text-sm text-white/40">Connect your wallet to redeem points</p>
                    <ShimmerButton onClick={onConnect} shimmerColor="#7c6cf0" className="px-8">
                      {isConnecting ? <><SpinnerIcon /> Connecting...</> : "Connect Wallet"}
                    </ShimmerButton>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-[#7c6cf0]/10 bg-[#7c6cf0]/[0.03] p-4 text-xs text-white/40 text-center">
                      Redeeming burns your points for off-chain rewards.<br />
                      Your current balance: <span className="font-mono text-[#fbbf24]">{myBalance?.toString() ?? "0"}</span> pts
                    </div>
                    <Input
                      label="Points to Redeem"
                      type="number"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                      placeholder="0"
                    />
                    {myBalance !== null && (
                      <button
                        onClick={() => setRedeemAmount(myBalance.toString())}
                        className="text-[10px] text-[#7c6cf0]/50 hover:text-[#7c6cf0]/80 text-left transition-colors"
                      >
                        Redeem all ({myBalance.toString()} available)
                      </button>
                    )}
                    <ShimmerButton onClick={handleRedeem} disabled={isRedeeming} shimmerColor="#7c6cf0" className="w-full">
                      {isRedeeming ? <><SpinnerIcon /> Redeeming...</> : <><GiftIcon /> Redeem Points</>}
                    </ShimmerButton>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Loyalty Points &middot; Soroban &middot; Permissionless</p>
            <div className="flex items-center gap-2">
              {Object.entries(ACTION_CONFIG).map(([action, cfg]) => (
                <span key={action} className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span className="font-mono text-[9px] text-white/15">{cfg.points}</span>
                </span>
              ))}
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="font-mono text-[9px] text-white/15">10</span>
              </span>
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
