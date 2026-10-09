import { useState } from "react";
import { backupQrSvg, exportBackup, importBackup } from "../backup";
import type { Save } from "../model";

export function BackupPanel({ save, onSave }: { save: Save; onSave: (save: Save) => void }) {
  const [code, setCode] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [note, setNote] = useState("");

  return (
    <section className="ac-panel ac-backup">
      <h2>Backup</h2>
      <p className="ac-hint">A code for this device only. It is not sent anywhere. Copy it if you want the progress on another device.</p>
      <button
        type="button"
        className="ac-go"
        onClick={() => {
          void exportBackup(save).then(async (next) => {
            setCode(next);
            setQr(await backupQrSvg(next));
            setNote("Backup code is ready.");
          });
        }}
      >
        Create backup code
      </button>
      {code ? (
        <>
          <textarea readOnly value={code} aria-label="Backup code" onFocus={(e) => e.currentTarget.select()} />
          <button
            type="button"
            className="ac-quiet"
            onClick={() => {
              const clip = navigator.clipboard;
              if (!clip) {
                setNote("Select the code and copy it.");
                return;
              }
              void clip.writeText(code).then(
                () => setNote("Copied."),
                () => setNote("Select the code and copy it."),
              );
            }}
          >
            Copy code
          </button>
          {qr ? <div className="ac-qr" dangerouslySetInnerHTML={{ __html: qr }} /> : <p className="ac-hint">This backup is long. Use the code.</p>}
        </>
      ) : null}
      <label className="ac-field">
        Restore a backup
        <textarea value={paste} aria-label="Paste backup code" onChange={(e) => setPaste(e.target.value)} />
      </label>
      <button
        type="button"
        className="ac-quiet"
        onClick={() => {
          void importBackup(paste).then((next) => {
            if (!next) {
              setNote("That code did not work.");
              return;
            }
            onSave(next);
            setNote("Restored on this device.");
          });
        }}
      >
        Restore on this device
      </button>
      {note ? <p className="ac-hint">{note}</p> : null}
    </section>
  );
}
