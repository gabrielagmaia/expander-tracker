import { describe, it, expect } from "vitest";
import { calculateProgress, buildCompletedTurnMap } from "@/lib/expander";
import {
  addDays,
  dayNumberForDate,
  logDateForDay,
  todayISO,
} from "@/lib/dateUtils";
import type { ExpanderTreatment, ExpanderDailyLog } from "@/types/expander";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const baseTreatment = (total_days: number): ExpanderTreatment => ({
  id: "t1",
  child_name: "Emma",
  start_date: "2026-06-01",
  total_days,
  turns_per_day: 1,
  reminder_time: null,
  status: "active",
  notes: null,
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
});

let _idSeq = 0;
function makeLog(
  overrides: Partial<ExpanderDailyLog> & { log_date: string; status: ExpanderDailyLog["status"] }
): ExpanderDailyLog {
  _idSeq++;
  return {
    id: `log-${_idSeq}`,
    treatment_id: "t1",
    day_number: dayNumberForDate("2026-06-01", overrides.log_date),
    completed_at: overrides.status === "done" ? `${overrides.log_date}T10:00:00Z` : null,
    discomfort_level: null,
    notes: null,
    created_at: `${overrides.log_date}T00:00:00Z`,
    updated_at: `${overrides.log_date}T00:00:00Z`,
    ...overrides,
  };
}

// ─── calculateProgress ────────────────────────────────────────────────────────

describe("calculateProgress — 21-day target, no missed days", () => {
  it("counts only done logs", () => {
    const treatment = baseTreatment(21);
    const logs = Array.from({ length: 21 }, (_, i) =>
      makeLog({ log_date: addDays("2026-06-01", i), status: "done" })
    );
    const p = calculateProgress(treatment, logs);
    expect(p.completedDays).toBe(21);
    expect(p.remainingDays).toBe(0);
    expect(p.progressPercentage).toBe(100);
    expect(p.isComplete).toBe(true);
    expect(p.estimatedEndDate).toBeNull();
  });

  it("returns zero remaining when half done", () => {
    const treatment = baseTreatment(21);
    const logs = [
      ...Array.from({ length: 10 }, (_, i) =>
        makeLog({ log_date: addDays("2026-06-01", i), status: "done" })
      ),
      ...Array.from({ length: 11 }, (_, i) =>
        makeLog({ log_date: addDays("2026-06-11", i), status: "pending" })
      ),
    ];
    const p = calculateProgress(treatment, logs);
    expect(p.completedDays).toBe(10);
    expect(p.remainingDays).toBe(11);
    expect(p.progressPercentage).toBe(48);
    expect(p.isComplete).toBe(false);
  });
});

describe("calculateProgress — missed days do not count", () => {
  it("21-day target with one missed day: target stays 21", () => {
    const treatment = baseTreatment(21);
    const logs = [
      makeLog({ log_date: "2026-06-01", status: "done" }),
      makeLog({ log_date: "2026-06-02", status: "done" }),
      makeLog({ log_date: "2026-06-03", status: "missed" }),
      makeLog({ log_date: "2026-06-04", status: "done" }),
    ];
    const p = calculateProgress(treatment, logs);
    expect(p.completedDays).toBe(3); // only done logs
    expect(p.remainingDays).toBe(18); // 21 - 3
    expect(p.totalDays).toBe(21);
    expect(p.isComplete).toBe(false);
  });

  it("21-day target with multiple missed days: remainingDays stays correct", () => {
    const treatment = baseTreatment(21);
    const logs = [
      makeLog({ log_date: "2026-06-01", status: "done" }),
      makeLog({ log_date: "2026-06-02", status: "missed" }),
      makeLog({ log_date: "2026-06-03", status: "missed" }),
      makeLog({ log_date: "2026-06-04", status: "done" }),
      makeLog({ log_date: "2026-06-05", status: "done" }),
    ];
    const p = calculateProgress(treatment, logs);
    expect(p.completedDays).toBe(3);
    expect(p.remainingDays).toBe(18);
  });

  it("missed day followed by completed day: completedDays increments normally", () => {
    const treatment = baseTreatment(21);
    const logs = [
      makeLog({ log_date: "2026-06-01", status: "missed" }),
      makeLog({ log_date: "2026-06-02", status: "done" }),
    ];
    const p = calculateProgress(treatment, logs);
    expect(p.completedDays).toBe(1);
    expect(p.remainingDays).toBe(20);
  });

  it("skipped_by_dentist does not count toward completed days", () => {
    const treatment = baseTreatment(21);
    const logs = [
      makeLog({ log_date: "2026-06-01", status: "done" }),
      makeLog({ log_date: "2026-06-02", status: "skipped_by_dentist" }),
      makeLog({ log_date: "2026-06-03", status: "done" }),
    ];
    const p = calculateProgress(treatment, logs);
    expect(p.completedDays).toBe(2);
    expect(p.remainingDays).toBe(19);
  });
});

describe("calculateProgress — status changes", () => {
  it("changing a missed day back to done increases completedDays", () => {
    const treatment = baseTreatment(21);
    const logsWithMissed = [
      makeLog({ log_date: "2026-06-01", status: "done" }),
      makeLog({ log_date: "2026-06-02", status: "missed" }),
    ];
    const logsWithFixed = [
      makeLog({ log_date: "2026-06-01", status: "done" }),
      makeLog({ log_date: "2026-06-02", status: "done" }),
    ];
    expect(calculateProgress(treatment, logsWithMissed).completedDays).toBe(1);
    expect(calculateProgress(treatment, logsWithFixed).completedDays).toBe(2);
  });

  it("changing a done day back to missed decreases completedDays", () => {
    const treatment = baseTreatment(21);
    const before = [
      makeLog({ log_date: "2026-06-01", status: "done" }),
      makeLog({ log_date: "2026-06-02", status: "done" }),
    ];
    const after = [
      makeLog({ log_date: "2026-06-01", status: "done" }),
      makeLog({ log_date: "2026-06-02", status: "missed" }),
    ];
    expect(calculateProgress(treatment, before).completedDays).toBe(2);
    expect(calculateProgress(treatment, after).completedDays).toBe(1);
  });
});

describe("calculateProgress — total_days changes", () => {
  it("increasing total_days raises the remaining target", () => {
    const logs = Array.from({ length: 14 }, (_, i) =>
      makeLog({ log_date: addDays("2026-06-01", i), status: "done" })
    );
    const before = calculateProgress(baseTreatment(21), logs);
    const after = calculateProgress(baseTreatment(28), logs);
    expect(before.remainingDays).toBe(7);
    expect(after.remainingDays).toBe(14);
  });

  it("decreasing total_days lowers the remaining target", () => {
    const logs = Array.from({ length: 14 }, (_, i) =>
      makeLog({ log_date: addDays("2026-06-01", i), status: "done" })
    );
    const p = calculateProgress(baseTreatment(12), logs);
    expect(p.completedDays).toBe(14);
    expect(p.remainingDays).toBe(0);
    expect(p.progressPercentage).toBe(100);
    expect(p.isComplete).toBe(true);
  });

  it("completedDays exceeding new target: capped at 100%", () => {
    const logs = Array.from({ length: 14 }, (_, i) =>
      makeLog({ log_date: addDays("2026-06-01", i), status: "done" })
    );
    const p = calculateProgress(baseTreatment(10), logs);
    expect(p.progressPercentage).toBe(100);
    expect(p.remainingDays).toBe(0);
    expect(p.isComplete).toBe(true);
  });
});

describe("calculateProgress — nextTreatmentDayNumber", () => {
  it("is completedDays + 1 when not complete", () => {
    const treatment = baseTreatment(21);
    const logs = [makeLog({ log_date: "2026-06-01", status: "done" })];
    const p = calculateProgress(treatment, logs);
    expect(p.nextTreatmentDayNumber).toBe(2);
  });

  it("is totalDays + 1 when complete (graceful overflow)", () => {
    const treatment = baseTreatment(3);
    const logs = [
      makeLog({ log_date: "2026-06-01", status: "done" }),
      makeLog({ log_date: "2026-06-02", status: "done" }),
      makeLog({ log_date: "2026-06-03", status: "done" }),
    ];
    const p = calculateProgress(treatment, logs);
    expect(p.nextTreatmentDayNumber).toBe(4);
    expect(p.isComplete).toBe(true);
  });
});

describe("calculateProgress — estimated end date", () => {
  it("is null when treatment is complete", () => {
    const treatment = baseTreatment(1);
    const logs = [makeLog({ log_date: "2026-06-01", status: "done" })];
    expect(calculateProgress(treatment, logs).estimatedEndDate).toBeNull();
  });

  it("is today + remainingDays when incomplete", () => {
    const treatment = baseTreatment(21);
    const logs = [makeLog({ log_date: "2026-06-01", status: "done" })];
    const p = calculateProgress(treatment, logs);
    const expected = addDays(todayISO(), 20);
    expect(p.estimatedEndDate).toBe(expected);
  });
});

// ─── buildCompletedTurnMap ────────────────────────────────────────────────────

describe("buildCompletedTurnMap", () => {
  it("assigns turn numbers in log_date order for done logs", () => {
    const logs = [
      makeLog({ log_date: "2026-06-03", status: "done" }),
      makeLog({ log_date: "2026-06-01", status: "done" }),
      makeLog({ log_date: "2026-06-02", status: "missed" }),
      makeLog({ log_date: "2026-06-04", status: "done" }),
    ];
    const map = buildCompletedTurnMap(logs);
    // done logs sorted by date: June 1, June 3, June 4 → turns 1, 2, 3
    const june1 = logs.find((l) => l.log_date === "2026-06-01")!;
    const june3 = logs.find((l) => l.log_date === "2026-06-03")!;
    const june4 = logs.find((l) => l.log_date === "2026-06-04")!;
    const june2 = logs.find((l) => l.log_date === "2026-06-02")!;
    expect(map.get(june1.id)).toBe(1);
    expect(map.get(june3.id)).toBe(2);
    expect(map.get(june4.id)).toBe(3);
    expect(map.has(june2.id)).toBe(false); // missed, not in map
  });

  it("missed day in the middle does not affect numbering", () => {
    // June 3 is missed; June 4 is Treatment Day 3, not Day 4
    const logs = [
      makeLog({ log_date: "2026-06-01", status: "done" }), // T-Day 1
      makeLog({ log_date: "2026-06-02", status: "done" }), // T-Day 2
      makeLog({ log_date: "2026-06-03", status: "missed" }),
      makeLog({ log_date: "2026-06-04", status: "done" }), // T-Day 3
      makeLog({ log_date: "2026-06-05", status: "done" }), // T-Day 4
    ];
    const map = buildCompletedTurnMap(logs);
    const june4 = logs.find((l) => l.log_date === "2026-06-04")!;
    expect(map.get(june4.id)).toBe(3);
  });
});

// ─── Date utilities ───────────────────────────────────────────────────────────

describe("dateUtils", () => {
  describe("addDays", () => {
    it("crosses month boundary correctly", () => {
      expect(addDays("2026-06-30", 1)).toBe("2026-07-01");
    });

    it("crosses year boundary correctly", () => {
      expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    });

    it("crosses month with 28 days (Feb non-leap)", () => {
      expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    });

    it("handles leap year February", () => {
      expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
      expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
    });
  });

  describe("dayNumberForDate / logDateForDay round-trip", () => {
    it("dayNumberForDate is the inverse of logDateForDay", () => {
      const start = "2026-06-01";
      for (let n = 1; n <= 30; n++) {
        const date = logDateForDay(start, n);
        expect(dayNumberForDate(start, date)).toBe(n);
      }
    });

    it("day_number 1 equals start_date", () => {
      expect(logDateForDay("2026-06-01", 1)).toBe("2026-06-01");
    });

    it("crosses month boundaries in a 45-day treatment", () => {
      // June 1 + 44 days = July 15
      expect(logDateForDay("2026-06-01", 45)).toBe("2026-07-15");
      expect(dayNumberForDate("2026-06-01", "2026-07-15")).toBe(45);
    });
  });

  describe("todayISO", () => {
    it("returns a valid YYYY-MM-DD string in local time", () => {
      const today = todayISO();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // Verify it represents a real date (no UTC offset shift)
      const [y, m, d] = today.split("-").map(Number);
      const date = new Date();
      expect(y).toBe(date.getFullYear());
      expect(m).toBe(date.getMonth() + 1);
      expect(d).toBe(date.getDate());
    });
  });
});

// ─── No-duplicate guarantee (design-level) ───────────────────────────────────

describe("ensureActiveLogs design invariants", () => {
  it("dayNumberForDate produces unique numbers per date", () => {
    const start = "2026-06-01";
    const dates = Array.from({ length: 60 }, (_, i) => addDays(start, i));
    const dayNumbers = dates.map((d) => dayNumberForDate(start, d));
    const unique = new Set(dayNumbers);
    expect(unique.size).toBe(60);
  });

  it("logDateForDay produces unique dates per day_number", () => {
    const start = "2026-06-01";
    const dates = Array.from({ length: 60 }, (_, i) => logDateForDay(start, i + 1));
    const unique = new Set(dates);
    expect(unique.size).toBe(60);
  });
});
