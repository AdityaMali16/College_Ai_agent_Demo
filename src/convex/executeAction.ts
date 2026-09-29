import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Executes an approved action. The client calls this after the user clicks
 * "Confirm" in the approval card. Maps to "Execute Action" + "Verify Result".
 */
export const runApprovedAction = action({
  args: { actionId: v.id("actions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const record = await ctx.runQuery(api.agent.getAction, {
      actionId: args.actionId,
    });
    if (!record || record.userId !== userId) {
      throw new Error("Action not found");
    }
    if (record.status !== "approved") {
      throw new Error("Action is not approved for execution");
    }

    const payload = record.payload as Record<string, unknown>;
    let ok = true;
    let result = "";

    try {
      switch (record.type) {
        case "apply_leave": {
          const id = await ctx.runMutation(api.erp.applyLeave, {
            fromDate: String(payload.fromDate),
            toDate: String(payload.toDate),
            reason: String(payload.reason ?? "Leave requested via agent"),
          });
          result = `Leave application submitted (${String(payload.fromDate)} → ${String(payload.toDate)}).`;
          void id;
          break;
        }
        case "raise_ticket": {
          await ctx.runMutation(api.erp.raiseTicket, {
            subject: String(payload.subject ?? "Support request"),
            detail: String(payload.detail ?? ""),
          });
          result = `Support ticket created: "${String(payload.subject ?? "Support request")}".`;
          break;
        }
        case "register_course": {
          await ctx.runMutation(api.erp.registerCourse, {
            courseCode: String(payload.courseCode),
            courseTitle: String(payload.courseTitle ?? "Elective course"),
            credits: Number(payload.credits ?? 3),
          });
          result = `Registered for ${String(payload.courseCode)} — ${String(payload.courseTitle ?? "Elective course")}.`;
          break;
        }
        case "send_notice": {
          await ctx.runMutation(api.erp.postNotice, {
            title: String(payload.title ?? "Campus notice"),
            body: String(payload.body ?? ""),
            category: String(payload.category ?? "General"),
          });
          result = `Notice published: "${String(payload.title ?? "Campus notice")}".`;
          break;
        }
        case "pay_fee": {
          await ctx.runMutation(api.erp.payFee, {
            feeId: payload.feeId as never,
          });
          result = "Fee payment recorded.";
          break;
        }
        case "submit_complaint": {
          await ctx.runMutation(api.erp.submitComplaint, {
            complaintType: String(
              payload.complaintType ?? "Other",
            ),
            location: String(payload.location ?? "Boys Hostel"),
            roomNo: payload.roomNo
              ? String(payload.roomNo)
              : undefined,
            description: String(payload.description ?? ""),
          });
          result = `Complaint registered (${String(
            payload.complaintType ?? "Other",
          )} — ${String(payload.location ?? "")}).`;
          break;
        }
        case "book_guest_house": {
          await ctx.runMutation(api.erp.bookGuestHouse, {
            guestName: String(payload.guestName ?? "Guest"),
            guestHouse: String(payload.guestHouse ?? "Main Guest House"),
            checkIn: String(payload.checkIn),
            checkOut: String(payload.checkOut),
            guests: Number(payload.guests ?? 1),
            purpose: String(payload.purpose ?? "Family visit"),
          });
          result = `Guest house booking requested at ${String(
            payload.guestHouse ?? "Main Guest House",
          )} (${String(payload.checkIn)} → ${String(payload.checkOut)}).`;
          break;
        }
        case "book_equipment": {
          await ctx.runMutation(api.erp.bookEquipment, {
            equipmentName: String(payload.equipmentName),
            purpose: String(payload.purpose ?? ""),
            remarks: payload.remarks ? String(payload.remarks) : undefined,
            neededBy: payload.neededBy
              ? String(payload.neededBy)
              : undefined,
          });
          result = `Equipment booking requested: ${String(payload.equipmentName)}.`;
          break;
        }
        case "connect_request": {
          await ctx.runMutation(api.erp.submitConnectRequest, {
            topic: String(payload.topic ?? "Something else (personal)"),
            message: String(payload.message ?? ""),
            preferredMode: payload.preferredMode
              ? String(payload.preferredMode)
              : undefined,
          });
          result = "CONNECT wellness request submitted — confidential.";
          break;
        }
        case "register_exam": {
          await ctx.runMutation(api.erp.registerExam, {
            examType: payload.examType as
              | "carry"
              | "makeup"
              | "supplementary"
              | "i_grade"
              | "summer",
            courseCode: String(payload.courseCode),
            courseTitle: String(payload.courseTitle ?? ""),
          });
          result = `${String(payload.examType)} exam registration submitted for ${String(payload.courseCode)}.`;
          break;
        }
        default:
          ok = false;
          result = "Unknown action type";
      }
    } catch (error) {
      ok = false;
      result =
        error instanceof Error ? error.message : "Execution failed";
    }

    await ctx.runMutation(api.agent.markActionExecuted, {
      actionId: args.actionId,
      ok,
      result,
    });

    return { ok, result };
  },
});

/** Simple audit log helper (maps to Audit Logs node). */
export const auditLog = mutation({
  args: {
    userId: v.id("users"),
    event: v.string(),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log(
      `[audit] user=${args.userId} event=${args.event}${args.detail ? ` detail=${args.detail}` : ""}`,
    );
    void ctx;
  },
});
