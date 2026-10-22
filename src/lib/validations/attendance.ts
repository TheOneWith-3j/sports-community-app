import { z } from "zod";

export const attendanceStatusSchema = z.enum(["present", "absent", "no_show"]);

export const markAttendanceSchema = z
  .object({
    participantId: z.string().uuid(),
    status: attendanceStatusSchema,
  })
  .strict();

export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
