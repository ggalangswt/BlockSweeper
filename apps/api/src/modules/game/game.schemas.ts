import { z } from "zod";

const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address");
const txHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash");

export const startGameSchema = z.object({
  walletAddress: walletAddressSchema,
  txHash: txHashSchema,
  weekId: z.number().int().positive().optional(),
});

export const cellPositionSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
});

export const revealCellsSchema = z.object({
  sessionId: z.string().min(1),
  cells: z.array(cellPositionSchema).min(1),
});

export const finishGameSchema = z
  .object({
    sessionId: z.string().min(1),
    status: z.enum(["won", "lost"]),
    revealedCells: z.array(cellPositionSchema),
    explodedCell: cellPositionSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "lost" && !value.explodedCell) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["explodedCell"],
        message: "explodedCell is required for lost games",
      });
    }

    if (value.status === "won" && value.explodedCell) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["explodedCell"],
        message: "explodedCell must be omitted for won games",
      });
    }
  });

export const weekIdQuerySchema = z.object({
  weekId: z.coerce.number().int().positive().optional(),
});

export const walletStatsParamsSchema = z.object({
  walletAddress: walletAddressSchema,
});

export type StartGameRequest = z.infer<typeof startGameSchema>;
export type RevealCellsRequest = z.infer<typeof revealCellsSchema>;
export type FinishGameRequest = z.infer<typeof finishGameSchema>;
export type WeekIdQuery = z.infer<typeof weekIdQuerySchema>;
export type WalletStatsParams = z.infer<typeof walletStatsParamsSchema>;
