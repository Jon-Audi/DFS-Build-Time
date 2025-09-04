
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { beforeUserCreated } from "firebase-functions/v2/identity";
import { onSchedule } from "firebase-functions/v2/scheduler";
admin.initializeApp();

const db = admin.firestore();

// --- Config / constants ---
const REGION = "us-central1";
// Restrict signups to a domain (edit if needed)
const ALLOWED_SIGNUP_DOMAIN = "delawarefencesolutions.com"; 

// --- Helpers ---
function toDate(input: any): Date | null {
  if (!input) return null;
  // Firestore Timestamp
  if (typeof input.toDate === "function") return input.toDate();
  // number (ms) or ISO string
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

async function getEffectiveRates(userId?: string, taskTypeId?: string) {
  const reads = [
    db.doc("rates/default").get(),
  ];
  if (userId) reads.push(db.doc(`users/${userId}`).get());
  if (taskTypeId) reads.push(db.doc(`taskTypes/${taskTypeId}`).get());

  const [ratesSnap, userSnap, taskTypeSnap] = await Promise.all([
    reads[0] as Promise<admin.firestore.DocumentSnapshot>,
    reads[1] as Promise<admin.firestore.DocumentSnapshot | null> ?? Promise.resolve(null),
    reads[2] as Promise<admin.firestore.DocumentSnapshot | null> ?? Promise.resolve(null),
  ]);

  const rates = ratesSnap.exists ? ratesSnap.data()! : {};
  const user = userSnap?.exists ? userSnap.data()! : {};
  const taskType = taskTypeSnap?.exists ? taskTypeSnap.data()! : {};

  const hourlyRate =
    Number((user as any).hourlyRate) ||
    Number((taskType as any).defaultLaborRate) ||
    Number((rates as any).defaultLaborRate) ||
    0;
  const overheadPct =
    Number((taskType as any).defaultOverheadPct) ||
    Number((rates as any).defaultOverheadPct) ||
    0;
  
  return { hourlyRate, overheadPct };
}

async function recomputeJobTotals(jobRef: admin.firestore.DocumentReference) {
  const [materialsSnap, sessionsSnap, ratesSnap] = await Promise.all([
    jobRef.collection("materials").get(),
    jobRef.collection("sessions").get(),
    db.doc("rates/default").get(),
  ]);

  const rates = ratesSnap.exists ? ratesSnap.data()! : {};
  const materialCost = materialsSnap.docs
    .reduce((sum, d) => sum + (Number(d.data().subtotal) || 0), 0);
  const laborCost = sessionsSnap.docs
    .reduce((sum, d) => sum + (Number(d.data().laborCost) || 0), 0);
  
  const overheadPct = Number((rates as any).defaultOverheadPct || 0);
  const overheadCost = round2((materialCost + laborCost) * overheadPct);
  const totalCost = round2(materialCost + laborCost + overheadCost);

  await jobRef.set({
    materialCost: round2(materialCost),
    laborCost: round2(laborCost),
    overheadCost,
    totalCost,
    totalsComputedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

// --- Firestore: materials subtotal ---
export const onMaterialWrite = onDocumentWritten({
  region: REGION,
  document: "jobs/{jobId}/materials/{materialId}",
  retry: false,
}, async (event) => {
  const after = event.data?.after;
  if (!after?.exists) return; // Deletion will trigger job recompute below

  const data = after.data();
  const quantity = Number(data.quantity || 0);
  const unitCost = Number(data.unitCost || 0);
  const newSubtotal = round2(quantity * unitCost);

  const prev = event.data?.before?.data();
  const prevSubtotal = Number(prev?.subtotal ?? NaN);

  if (prev && prevSubtotal === newSubtotal) {
    // No change; avoid loop
  } else {
    await after.ref.set({
      subtotal: newSubtotal,
      computedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  // Recompute job totals
  const jobRef = after.ref.parent.parent!;
  await recomputeJobTotals(jobRef);
});


// --- Firestore: session duration + labor cost ---
export const onSessionWrite = onDocumentWritten({
  region: REGION,
  document: "jobs/{jobId}/sessions/{sessionId}",
  retry: false,
}, async (event) => {
  const after = event.data?.after;
  if (!after?.exists) return;

  const data = after.data();
  const startedAt = toDate(data.startedAt);
  const stoppedAt = toDate(data.stoppedAt);

  // Only compute when we have both timestamps
  if (!startedAt || !stoppedAt) return;

  const durationSec = Math.max(
    0,
    Math.floor((stoppedAt.getTime() - startedAt.getTime()) / 1000)
  );
  const hours = durationSec / 3600;

  const { hourlyRate } = await getEffectiveRates(data.userId, data.taskTypeId);
  const laborCost = round2(hours * (Number(hourlyRate) || 0));

  const prev = event.data?.before?.data();
  const same =
    Number(prev?.durationSec ?? NaN) === durationSec &&
    Number(prev?.laborCost ?? NaN) === laborCost;

  if (!same) {
    await after.ref.set({
      durationSec,
      laborCost,
      computedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  // Recompute job totals after session change
  const jobRef = after.ref.parent.parent!;
  await recomputeJobTotals(jobRef);
});

// --- Optional: when rates or task types change, recalc recent sessions ---
export const onRatesWrite = onDocumentWritten(
  { region: REGION, document: "rates/{docId}", retry: false },
  async (event) => {
    logger.info("Rates changed; consider re-running a backfill if needed.");
    // For large datasets, prefer a manual callable backfill (below).
  }
);
export const onTaskTypeWrite = onDocumentWritten(
  { region: REGION, document: "taskTypes/{taskTypeId}", retry: false },
  async (event) => {
    logger.info("Task type changed; consider re-running a backfill if needed.");
  }
);


// --- Callable: admin sets role + (optional) hourlyRate ---
export const setRoleClaim = onCall({ region: REGION }, async (req) => {
  // Require caller to be admin
  if (req.auth?.token?.role !== "admin") {
    throw new HttpsError("permission-denied", "admin only");
  }
  const { uid, role, hourlyRate } = req.data;
  await admin.auth().setCustomUserClaims(uid, { role });

  if (typeof hourlyRate === "number") {
    await db.doc(`users/${uid}`).set({ rate: hourlyRate }, { merge: true });
  }
  // Force token refresh recommended on client
  return { ok: true };
});

// --- Callable: invite a user (creates temp password) ---
export const inviteUser = onCall({ region: REGION }, async (req) => {
  if (req.auth?.token?.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin role required to invite users.");
  }

  const { email, role, hourlyRate, name } = req.data;

  if (!email || !role) {
    throw new HttpsError("invalid-argument", "Email and role are required.");
  }

  // Generate a secure temporary password on the server
  const tempPassword = Math.random().toString(36).slice(-8) + "A1!";

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password: tempPassword,
      emailVerified: false,
      disabled: false,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    const userDoc = {
        name: name || email.split('@')[0],
        email,
        role,
        rate: Number(hourlyRate) || 0,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.doc(`users/${userRecord.uid}`).set(userDoc, { merge: true });

    return { uid: userRecord.uid, email, tempPassword };

  } catch (error: any) {
    logger.error("Error inviting user:", error);
    if (error.code === 'auth/email-already-exists') {
        throw new HttpsError('already-exists', 'A user with this email already exists.');
    }
    throw new HttpsError("internal", `An unexpected error occurred. Please check the function logs. Message: ${error.message}`);
  }
});


// --- Signup restriction: block non-DFS domains (edit constant above to change) ---
export const enforceSignupDomain = beforeUserCreated({ region: REGION }, (event) => {
  const email = event.data.email || "";
  const domain = email.split("@")[1]?.toLowerCase() || "";

  if (!ALLOWED_SIGNUP_DOMAIN) return; // disabled if empty

  if (domain !== ALLOWED_SIGNUP_DOMAIN.toLowerCase()) {
    throw new HttpsError(
      "invalid-argument",
      `Only ${ALLOWED_SIGNUP_DOMAIN} accounts may sign up.`
    );
  }
});


// --- Callable: CSV export (sessions or job cost summary) ---
export const exportCSV = onCall({ region: REGION, timeoutSeconds: 540 }, async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "unauthenticated");

    // Supervisors and admins only (exports are sensitive)
    const role = req.auth.token.role;
    if (!["admin", "supervisor"].includes(role)) {
      throw new HttpsError("permission-denied", "permission-denied");
    }

    const { kind, from, to, jobId, userId } = req.data;
    const start = from ? new Date(from) : new Date("1970-01-01T00:00:00Z");
    const end = to ? new Date(to) : new Date("2999-12-31T23:59:59Z");

    const rows: any[] = [];
    if (kind === "sessions") {
      // collection group query
      let q: admin.firestore.Query = db.collectionGroup("sessions")
        .where("startedAt", ">=", start)
        .where("startedAt", "<", end);
      if (userId) q = q.where("userId", "==", userId);
      if (jobId) q = q.where("jobId", "==", jobId); // if you store jobId in session doc; optional

      const snap = await q.get();
      snap.forEach((doc) => {
        const d = doc.data();
        rows.push({
          sessionId: doc.id,
          jobPath: doc.ref.parent.parent?.path || "",
          userId: d.userId || "",
          taskTypeId: d.taskTypeId || "",
          startedAt: d.startedAt?.toDate?.()?.toISOString?.() ?? d.startedAt,
          stoppedAt: d.stoppedAt?.toDate?.()?.toISOString?.() ?? d.stoppedAt,
          durationSec: d.durationSec ?? "",
          unitsCompleted: d.unitsCompleted ?? "",
          laborCost: d.laborCost ?? "",
          notes: d.notes ?? "",
        });
      });
    } else if (kind === "jobs") {
      const snap = await db.collection("jobs")
        .where("createdAt", ">=", start)
        .where("createdAt", "<", end)
        .get();

      snap.forEach((doc) => {
        const d = doc.data();
        rows.push({
          jobId: doc.id,
          name: d.name || "",
          customer: d.customer || "",
          status: d.status || "",
          materialCost: d.materialCost ?? 0,
          laborCost: d.laborCost ?? 0,
          overheadCost: d.overheadCost ?? 0,
          totalCost: d.totalCost ?? 0,
          createdAt: d.createdAt?.toDate?.()?.toISOString?.() ?? d.createdAt,
        });
      });
    } else {
      throw new HttpsError("invalid-argument", "invalid kind");
    }

    // Convert to CSV and store in Storage
    const Papa = await import("papaparse"); // dynamic import
    const csv = Papa.unparse(rows);

    const bucket = admin.storage().bucket();
    const fileName = `exports/${kind}-${Date.now()}.csv`;
    const file = bucket.file(fileName);
    await file.save(csv, { contentType: "text/csv" });

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60, // 1 hour
    });

    return { url, count: rows.length, file: fileName };
  }
);


// --- Nightly aggregates (yesterday) ---
export const dailyAggregate = onSchedule({
  region: REGION,
  schedule: "5 2 * * *", // 02:05 every day
  timeZone: "America/New_York",
}, async () => {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 4, 0, 0)); // approx 00:00 ET
  const start = new Date(end.getTime() - (24 * 60 * 60 * 1000));

  // Sessions in range
  const snap = await db.collectionGroup("sessions")
    .where("startedAt", ">=", start)
    .where("startedAt", "<", end)
    .get();

  let totalSeconds = 0;
  let totalLabor = 0;
  snap.forEach((d) => {
    const s = d.data();
    totalSeconds += Number(s.durationSec || 0);
    totalLabor += Number(s.laborCost || 0);
  });
  const totalHours = round2(totalSeconds / 3600);

  // Materials added yesterday (approx by createdAt if you store it; otherwise skip)
  // Fallback: not summing materials here—use job totals periodically.

  const docId = `${start.getUTCFullYear()}${String(start.getUTCMonth() + 1).padStart(2, "0")}${String(start.getUTCDate()).padStart(2, "0")}`;
  await db.doc(`aggregates/${docId}`).set({
    totalHours,
    totalLaborCost: round2(totalLabor),
    totalJobs: admin.firestore.FieldValue.increment(0), // placeholder, update if you track per-day jobs
    totalMaterialCost: admin.firestore.FieldValue.increment(0), // optional
    computedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
});
