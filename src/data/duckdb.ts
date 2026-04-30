import * as duckdb from '@duckdb/duckdb-wasm'
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'

const BUNDLES: duckdb.DuckDBBundles = {
  mvp: { mainModule: duckdb_wasm, mainWorker: mvp_worker },
  eh: { mainModule: duckdb_wasm_eh, mainWorker: eh_worker },
}

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null

async function init(): Promise<duckdb.AsyncDuckDB> {
  const bundle = await duckdb.selectBundle(BUNDLES)
  if (!bundle.mainWorker) {
    throw new Error('DuckDB-WASM bundle missing mainWorker')
  }
  const worker = new Worker(bundle.mainWorker)
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING)
  const db = new duckdb.AsyncDuckDB(logger, worker)
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
  return db
}

/**
 * Singleton accessor — first call instantiates the DuckDB-WASM worker; later
 * calls return the same instance. Idle prefetch (see `prefetchDuckDB`) calls
 * this from `requestIdleCallback` so the user's first click finds it warm.
 */
export function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (!dbPromise) dbPromise = init()
  return dbPromise
}

/**
 * Schedule DuckDB-WASM instantiation in the browser's idle window. No-op on
 * the server. Failures clear the cached promise so a subsequent click retries
 * cleanly. Resolves the cold-load risk surfaced in the 2026-04-30 doc-review:
 * a 5MB WASM fetch on dorm wifi (3-10 Mbps) blocks click-time interaction by
 * 4-13 seconds; idle prefetch makes that wait invisible.
 */
export function prefetchDuckDB(): void {
  if (typeof window === 'undefined') return
  const schedule =
    'requestIdleCallback' in window
      ? (cb: () => void) =>
          window.requestIdleCallback(cb, { timeout: 3000 })
      : (cb: () => void) => window.setTimeout(cb, 1500)
  schedule(() => {
    getDuckDB().catch((err) => {
      console.warn('DuckDB-WASM idle prefetch failed (will retry on click):', err)
      dbPromise = null
    })
  })
}
