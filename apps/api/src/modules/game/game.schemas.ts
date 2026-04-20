import { z } from "zod";

const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address");
const txHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash");

export const startGameSchema = z.object({
  walletAddress: walletAddressSchema,
  txHash: txHashSchema,
  weekId: z.number().int().positive(),
});

export const cellPositionSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
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

export type StartGameRequest = z.infer<typeof startGameSchema>;
export type FinishGameRequest = z.infer<typeof finishGameSchema>;
