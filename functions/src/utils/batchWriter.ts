import * as admin from 'firebase-admin';

/**
 * BatchWriter utility for writing large datasets to Firestore in controlled batches
 * to avoid memory issues and timeout problems.
 * 
 * Usage:
 * ```typescript
 * const writer = new BatchWriter(db);
 * await writer.writeBatch(jobs, async (job, batch, db) => {
 *   const ref = db.collection('jobs').doc(job.id);
 *   batch.set(ref, job, { merge: true });
 * });
 * ```
 */

export interface BatchWriteOptions {
    batchSize?: number;
    logProgress?: boolean;
    onBatchComplete?: (batchNumber: number, itemsWritten: number) => void;
}

export class BatchWriter {
    private db: admin.firestore.Firestore;

    constructor(db: admin.firestore.Firestore) {
        this.db = db;
    }

    /**
     * Write items to Firestore in controlled batches
     * @param items Array of items to write
     * @param writeFn Function that adds writes to the batch
     * @param options Batch configuration options
     */
    async writeBatch<T>(
        items: T[],
        writeFn: (item: T, batch: admin.firestore.WriteBatch, db: admin.firestore.Firestore) => void,
        options: BatchWriteOptions = {}
    ): Promise<{ written: number; failed: number }> {
        const {
            batchSize = 500,
            logProgress = true,
            onBatchComplete
        } = options;

        let written = 0;
        let failed = 0;

        for (let i = 0; i < items.length; i += batchSize) {
            const chunk = items.slice(i, i + batchSize);
            const batch = this.db.batch();
            const batchNumber = Math.floor(i / batchSize) + 1;

            try {
                // Add all items in this chunk to the batch
                for (const item of chunk) {
                    writeFn(item, batch, this.db);
                }

                // Commit the batch
                await batch.commit();
                written += chunk.length;

                if (logProgress) {
                    console.log(`[BatchWriter] Batch ${batchNumber}: Wrote ${written}/${items.length} items`);
                }

                if (onBatchComplete) {
                    onBatchComplete(batchNumber, written);
                }

            } catch (error: any) {
                console.error(`[BatchWriter] Batch ${batchNumber} failed:`, error.message);
                failed += chunk.length;
            }
        }

        if (logProgress) {
            console.log(`[BatchWriter] Complete: ${written} written, ${failed} failed`);
        }

        return { written, failed };
    }

    /**
     * Simplified batch write for a single collection
     * @param collectionName Firestore collection name
     * @param items Items to write (must have 'id' field)
     * @param options Batch configuration options
     */
    async writeToCollection<T extends { id: string }>(
        collectionName: string,
        items: T[],
        options: BatchWriteOptions = {}
    ): Promise<{ written: number; failed: number }> {
        return this.writeBatch(
            items,
            (item, batch, db) => {
                const ref = db.collection(collectionName).doc(item.id);
                const { id, ...data } = item;
                batch.set(ref, data, { merge: true });
            },
            options
        );
    }
}
