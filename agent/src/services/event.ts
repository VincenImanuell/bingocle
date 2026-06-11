import { ethers } from "ethers";
import { contracts, provider } from "../chain.js";

export type CreateEventInput = {
  token?: string; // default address(0) = native MNT
  // phase window lengths in minutes from "now" (on-chain block time)
  submissionMins?: number;
  founderMins?: number;
  marketMins?: number;
  liveMins?: number;
  disputeMins?: number;
  maxWordsPerUser?: number;
  founderSeedUnit?: bigint; // notional free-seed stake (base units)
  bonus?: { line: bigint; diagonal: bigint; doubleLine: bigint; fullCard: bigint };
};

/** Create an event on-chain via EventFactory and return its id. */
export async function createEvent(input: CreateEventInput): Promise<{
  eventId: number;
  txHash: string;
}> {
  const factory = contracts.eventFactory();
  const block = await provider().getBlock("latest");
  const now = BigInt(block!.timestamp);
  const min = (m: number) => BigInt(Math.round(m * 60));

  const submissionEnd = now + min(input.submissionMins ?? 15);
  const founderEnd = submissionEnd + min(input.founderMins ?? 2);
  const marketLock = founderEnd + min(input.marketMins ?? 15);
  const eventEnd = marketLock + min(input.liveMins ?? 60);
  const disputeEnd = eventEnd + min(input.disputeMins ?? 10);

  const bonus = input.bonus ?? {
    line: ethers.parseEther("5"),
    diagonal: ethers.parseEther("7"),
    doubleLine: ethers.parseEther("10"),
    fullCard: ethers.parseEther("50"),
  };
  const founderSeedUnit = input.founderSeedUnit ?? ethers.parseEther("1");

  const tx = await factory.createEvent(
    input.token ?? ethers.ZeroAddress,
    submissionEnd,
    founderEnd,
    marketLock,
    eventEnd,
    disputeEnd,
    input.maxWordsPerUser ?? 3,
    25,
    founderSeedUnit,
    [bonus.line, bonus.diagonal, bonus.doubleLine, bonus.fullCard],
  );
  const receipt = await tx.wait();

  // Parse the EventCreated log for the new id.
  let eventId = 0;
  for (const log of receipt?.logs ?? []) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed?.name === "EventCreated") {
        eventId = Number(parsed.args.eventId);
        break;
      }
    } catch {
      /* not our log */
    }
  }
  if (!eventId) eventId = Number(await factory.eventCount());

  return { eventId, txHash: receipt?.hash ?? tx.hash };
}

const PHASES = [
  "None",
  "Submission",
  "Founder",
  "Market",
  "Live",
  "Dispute",
  "Settled",
  "Cancelled",
];

/** Human-readable lifecycle phase for an event. */
export async function phaseOf(eventId: number): Promise<string> {
  const p: bigint = await contracts.eventFactory().phaseOf(eventId);
  return PHASES[Number(p)] ?? "Unknown";
}
