import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

const db = admin.firestore();

async function withFunctionWrite<T>(fn: () => Promise<T>) {
  // This is a conceptual wrapper.
  // The actual enforcement happens via security rules checking a custom claim
  // or a marker field, which isn't implemented here as the admin SDK bypasses rules.
  // For this implementation, we assume the function has the necessary privileges.
  return fn();
}

async function getEffectiveLaborRate(userId: string, taskTypeId?: string) {
  const [userSnap, rateSnap] = await Promise.all([
    db.doc(`users/${userId}`).get(),
    db.doc(`rates/default`).get()
  ]);
  const user = userSnap.data() || {};
  const rates = rateSnap.data() || {};
  // Optionally: read taskType.defaultLaborRate if you want task-specific overrides
  const rate = user.hourlyRate ?? rates.defaultLaborRate ?? 0;
  return Number(rate) || 0;
}

export const onSessionWrite = functions.firestore
  .document('jobs/{jobId}/sessions/{sessionId}')
  .onWrite(async (change) => {
    const after = change.after.exists ? change.after.data()! : null;
    if (!after || !after.startedAt || !after.stoppedAt) {
        // If the session is deleted or doesn't have timestamps, we'll just re-trigger job total calculation.
    } else {
        const startedAt = after.startedAt.toDate();
        const stoppedAt = after.stoppedAt.toDate();
    
        const durationSec = Math.max(0, Math.floor((stoppedAt.getTime() - startedAt.getTime()) / 1000));
        const hours = durationSec / 3600;
    
        const laborRate = await getEffectiveLaborRate(after.userId, after.taskTypeId);
        const laborCost = Number((hours * laborRate).toFixed(2));
    
        const hasChanges =
            after.durationSec !== durationSec ||
            after.laborCost !== laborCost;

        if (hasChanges) {
            await withFunctionWrite(async () => {
              await change.after.ref.set({
                durationSec,
                laborCost,
                computedAt: admin.firestore.FieldValue.serverTimestamp(),
              }, { merge: true });
            });
            return; // Return here because the set will trigger another onWrite, which will then calculate job totals.
        }
    }


    // Update job totals
    const jobRef = change.after.ref.parent.parent!;
    const [materialsSnap, sessionsSnap, ratesSnap] = await Promise.all([
        jobRef.collection('materials').get(),
        jobRef.collection('sessions').get(),
        db.doc('rates/default').get()
    ]);

    const rates = ratesSnap.data() || {};
    const materialCost = materialsSnap.docs.reduce((sum, d) => sum + (Number(d.data().subtotal) || 0), 0);
    const laborCostTotal = sessionsSnap.docs.reduce((sum, d) => sum + (Number(d.data().laborCost) || 0), 0);
    const overheadPct = Number(rates.defaultOverheadPct || 0) / 100; // Assuming percentage is stored as 0-100
    const overheadCost = Number(((materialCost + laborCostTotal) * overheadPct).toFixed(2));
    const totalCost = Number((materialCost + laborCostTotal + overheadCost).toFixed(2));

    await jobRef.set({
        materialCost,
        laborCost: laborCostTotal,
        overheadCost,
        totalCost,
        totalsComputedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });

export const onMaterialWrite = functions.firestore
  .document('jobs/{jobId}/materials/{materialId}')
  .onWrite(async (change) => {
    const after = change.after.exists ? change.after.data()! : null;
    
    if(!after || after.subtotal) {
        // If the material is deleted, or the subtotal is already calculated,
        // we'll proceed to calculate the job totals.
    } else {
        const quantity = Number(after.quantity || 0);
        const unitCost = Number(after.unitCost || 0);
        const subtotal = Number((quantity * unitCost).toFixed(2));

        if (after.subtotal !== subtotal) {
            await withFunctionWrite(async () => {
              await change.after.ref.set({
                subtotal,
                computedAt: admin.firestore.FieldValue.serverTimestamp(),
              }, { merge: true });
            });
            return; // Return here because this will re-trigger the function.
        }
    }
    
    // Recompute job totals
    const jobRef = change.after.ref.parent.parent!;
    const [materialsSnap, sessionsSnap, ratesSnap] = await Promise.all([
        jobRef.collection('materials').get(),
        jobRef.collection('sessions').get(),
        db.doc('rates/default').get()
    ]);

    const rates = ratesSnap.data() || {};
    const materialCost = materialsSnap.docs.reduce((sum, d) => sum + (Number(d.data().subtotal) || 0), 0);
    const laborCostTotal = sessionsSnap.docs.reduce((sum, d) => sum + (Number(d.data().laborCost) || 0), 0);
    const overheadPct = Number(rates.defaultOverheadPct || 0) / 100; // Assuming percentage is stored as 0-100
    const overheadCost = Number(((materialCost + laborCostTotal) * overheadPct).toFixed(2));
    const totalCost = Number((materialCost + laborCostTotal + overheadCost).toFixed(2));

    await jobRef.set({
        materialCost,
        laborCost: laborCostTotal,
        overheadCost,
        totalCost,
        totalsComputedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });

// Optional: simple callable to upsert materials from CSV rows
export const upsertMaterial = functions.https.onCall(async (data, context) => {
  if (!(context.auth && context.auth.token.role === 'admin')) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }
  // We can add zod validation here in a production app
  const { sku, name, unit, unitCost, description, isActive = true } = data;
  await db.doc(`materialsCatalog/${sku}`).set({
    name, unit, unitCost: Number(unitCost), description: description || '', isActive,
    lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
});
