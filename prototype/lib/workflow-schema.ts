import type { DatabaseSync } from 'node:sqlite';

export function initializeWorkflow(db: DatabaseSync) {
  if (Number(db.prepare('PRAGMA user_version').get()!.user_version) > 2) throw new Error('Database schema is newer than this application.');
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_revisions (reportId TEXT NOT NULL REFERENCES reports(id), version INTEGER NOT NULL, data TEXT NOT NULL, associations TEXT NOT NULL, PRIMARY KEY(reportId,version));
    CREATE TABLE IF NOT EXISTS submissions (reportId TEXT NOT NULL REFERENCES reports(id), version INTEGER NOT NULL, actorId TEXT NOT NULL REFERENCES actors(id), at TEXT NOT NULL, PRIMARY KEY(reportId,version));
    CREATE TABLE IF NOT EXISTS withdrawals (reportId TEXT PRIMARY KEY REFERENCES reports(id), actorId TEXT NOT NULL REFERENCES actors(id), reason TEXT NOT NULL, at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS moderation (id TEXT PRIMARY KEY, reportId TEXT NOT NULL REFERENCES reports(id), version INTEGER NOT NULL, decision TEXT NOT NULL, reason TEXT NOT NULL, actorId TEXT NOT NULL REFERENCES actors(id), at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS releases (id TEXT PRIMARY KEY, reportId TEXT NOT NULL REFERENCES reports(id), version INTEGER NOT NULL, text TEXT NOT NULL, actorId TEXT NOT NULL REFERENCES actors(id), at TEXT NOT NULL, active INTEGER NOT NULL, UNIQUE(reportId,version));
    CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, reportId TEXT NOT NULL REFERENCES reports(id), version INTEGER NOT NULL, institutionId TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','delivered','cancelled')), createdAt TEXT NOT NULL, deliveredAt TEXT, staleReason TEXT, UNIQUE(reportId,version,institutionId));
    CREATE TABLE IF NOT EXISTS institution_updates (id TEXT PRIMARY KEY, notificationId TEXT NOT NULL REFERENCES notifications(id), actorId TEXT NOT NULL REFERENCES actors(id), kind TEXT NOT NULL, message TEXT NOT NULL, at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS contributor_feedback (id TEXT PRIMARY KEY, updateId TEXT NOT NULL REFERENCES institution_updates(id), actorId TEXT NOT NULL REFERENCES actors(id), decision TEXT NOT NULL, reason TEXT NOT NULL, at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS report_links (id TEXT PRIMARY KEY, leftId TEXT NOT NULL REFERENCES reports(id), leftVersion INTEGER NOT NULL, rightId TEXT NOT NULL REFERENCES reports(id), rightVersion INTEGER NOT NULL, decision TEXT NOT NULL, reason TEXT NOT NULL, actorId TEXT NOT NULL REFERENCES actors(id), at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS notices (id TEXT PRIMARY KEY, linkId TEXT NOT NULL UNIQUE REFERENCES report_links(id), actorId TEXT NOT NULL REFERENCES actors(id), reason TEXT NOT NULL, at TEXT NOT NULL);
    PRAGMA user_version=2;
  `);
}
export function snapshotReport(db: DatabaseSync, id: string) {
  const row = db.prepare('SELECT version,data FROM reports WHERE id=?').get(id)!;
  const associations = db.prepare('SELECT institutionId,relationship,allowSharing FROM associations WHERE reportId=? ORDER BY rowid').all(id);
  db.prepare('INSERT OR IGNORE INTO report_revisions VALUES (?,?,?,?)').run(id, Number(row.version), String(row.data), JSON.stringify(associations));
}
export function invalidateSharing(db: DatabaseSync, id: string, reason: string) {
  db.prepare('UPDATE releases SET active=0 WHERE reportId=?').run(id);
  db.prepare("UPDATE notifications SET status=CASE WHEN status='pending' THEN 'cancelled' ELSE status END, staleReason=? WHERE reportId=?").run(reason, id);
}
