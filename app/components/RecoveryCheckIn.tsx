"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import {
  requestDevnetAirdrop,
  sendRecoveryCheckIn,
  type RecoveryProofPayload,
} from "@/lib/solana";
import type { RepResult } from "./PoseRehabTracker";
import type { Language } from "@/lib/speech";

interface Props {
  exerciseId: string;
  result: RepResult;
  onReset: () => void;
  lang?: Language;
}

type Status = "idle" | "airdropping" | "signing" | "confirmed" | "error";

export default function RecoveryCheckIn({
  exerciseId,
  result,
  onReset,
  lang = "vi",
}: Props) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [status, setStatus] = useState<Status>("idle");
  const [signature, setSignature] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const [balanceSol, setBalanceSol] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAirdrop() {
    if (!publicKey) return;
    setStatus("airdropping");
    setErrorMsg(null);
    try {
      await requestDevnetAirdrop(connection, publicKey, 1 * LAMPORTS_PER_SOL);
      const lamports = await connection.getBalance(publicKey, "confirmed");
      setBalanceSol(lamports / LAMPORTS_PER_SOL);
      setStatus("idle");
    } catch (e) {
      console.error(e);
      setErrorMsg(
        lang === "vi"
          ? "Airdrop thất bại (Devnet có thể đang giới hạn tần suất). Thử lại sau ít phút hoặc dùng https://faucet.solana.com."
          : "Airdrop failed (Devnet rate limit reached). Try again or use https://faucet.solana.com."
      );
      setStatus("error");
    }
  }

  async function handleSignAndSend() {
    if (!publicKey) return;
    setStatus("signing");
    setErrorMsg(null);
    try {
      const payload: RecoveryProofPayload = {
        patientPublicKey: publicKey.toBase58(),
        exerciseId,
        repsCompleted: result.reps,
        repsTarget: result.targetReps,
        formQualityScore: result.formQualityScore,
        timestampIso: new Date().toISOString(),
      };

      const signAndSend = async (tx: Transaction) =>
        sendTransaction(tx, connection);

      const { signature, explorerUrl } = await sendRecoveryCheckIn(
        connection,
        publicKey,
        payload,
        signAndSend
      );

      setSignature(signature);
      setExplorerUrl(explorerUrl);
      setStatus("confirmed");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(
        e?.message ||
          (lang === "vi"
            ? "Giao dịch thất bại. Vui lòng thử lại."
            : "Transaction failed. Please try again.")
      );
      setStatus("error");
    }
  }

  if (!connected || !publicKey) {
    return (
      <div className="text-center text-sm text-gray-500 mt-4 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        {lang === "vi"
          ? "👉 Kết nối ví Phantom (Devnet) ở góc trên để ký ghi nhận mốc phục hồi lên blockchain."
          : "👉 Connect Phantom Wallet (Devnet) above to record your recovery proof on-chain."}
      </div>
    );
  }

  return (
    <div className="mt-6 border-t pt-6 flex flex-col items-center gap-3">
      <div className="text-center">
        <p className="font-semibold text-care-700 text-lg">
          {lang === "vi"
            ? `✅ Hoàn thành bài tập: ${result.reps}/${result.targetReps} lần`
            : `✅ Exercise Completed: ${result.reps}/${result.targetReps} reps`}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">
          {lang === "vi"
            ? `Điểm chất lượng động tác (AI chấm theo góc gối): ${result.formQualityScore}/100`
            : `Form Quality Score (AI Knee-angle calculated): ${result.formQualityScore}/100`}
        </p>
      </div>

      {balanceSol !== null && (
        <p className="text-xs text-gray-400">
          {lang === "vi" ? "Số dư Devnet:" : "Devnet Balance:"}{" "}
          {balanceSol.toFixed(3)} SOL
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-2 mt-2">
        <button
          onClick={handleAirdrop}
          disabled={status === "airdropping" || status === "signing"}
          className="px-4 py-2 rounded-xl border border-care-500 text-care-700 text-sm font-medium hover:bg-care-50 disabled:opacity-50 transition"
        >
          {status === "airdropping"
            ? lang === "vi"
              ? "Đang xin SOL Devnet…"
              : "Requesting Devnet SOL…"
            : lang === "vi"
            ? "1. Xin 1 SOL Devnet (miễn phí)"
            : "1. Request 1 Devnet SOL (Free)"}
        </button>

        <button
          onClick={handleSignAndSend}
          disabled={status === "signing" || status === "confirmed"}
          className="px-4 py-2 rounded-xl bg-care-600 text-white text-sm font-medium hover:bg-care-700 disabled:opacity-50 transition shadow-xs"
        >
          {status === "signing"
            ? lang === "vi"
              ? "Chờ ký trên Phantom…"
              : "Waiting for Phantom approval…"
            : status === "confirmed"
            ? lang === "vi"
              ? "Đã ghi nhận on-chain ✓"
              : "Verified On-chain ✓"
            : lang === "vi"
            ? "2. Ký & ghi nhận lên Solana Devnet"
            : "2. Sign & Record on Solana Devnet"}
        </button>
      </div>

      {errorMsg && <p className="text-sm text-red-600 mt-1">{errorMsg}</p>}

      {status === "confirmed" && signature && (
        <div className="mt-2 w-full max-w-md bg-care-50 border border-care-200 rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-600 break-all mb-2">
            {lang === "vi" ? "Chữ ký giao dịch:" : "Tx Signature:"}{" "}
            <span className="font-mono font-semibold text-slate-800">{signature}</span>
          </p>
          <a
            href={explorerUrl!}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-care-700 hover:text-care-800 underline text-sm font-semibold"
          >
            <span>
              {lang === "vi"
                ? "Xem trên Solana Explorer (Devnet) →"
                : "View on Solana Explorer (Devnet) →"}
            </span>
          </a>
        </div>
      )}

      <button
        onClick={onReset}
        className="text-xs text-gray-400 hover:text-gray-600 underline mt-3 transition"
      >
        {lang === "vi" ? "Tập lại bài khác" : "Start another exercise"}
      </button>
    </div>
  );
}
