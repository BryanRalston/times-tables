import { useState } from "react";
import { backupQrSvg, exportBackup, importBackup } from "../backup";
import { show } from "../i18n";
import type { Save } from "../model";

export function BackupPanel({ save, onSave }: { save: Save; onSave: (save: Save) => void }) {
  const [code, setCode] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [note, setNote] = useState("");

  return (
    <section className="ac-panel ac-backup">
      <h2>{show("Backup")}</h2>
      <p className="ac-hint">{show("A code for this device only. It is not sent anywhere. Copy it if you want the progress on another device.")}</p>
      <button
        type="button"
        className="ac-go"
        onClick={() => {
          void exportBackup(save).then(async (next) => {
            setCode(next);
            setQr(await backupQrSvg(next));
            setNote(show("Backup code is ready."));
          });
        }}
      >
        {show("Create backup code")}
      </button>
      {code ? (
        <>
          <textarea readOnly value={code} aria-label={show("Backup code")} onFocus={(e) => e.currentTarget.select()} />
          <button
            type="button"
            className="ac-quiet"
            onClick={() => {
              const clip = navigator.clipboard;
              if (!clip) {
                setNote(show("Select the code and copy it."));
                return;
              }
              void clip.writeText(code).then(
                () => setNote(show("Copied.")),
                () => setNote(show("Select the code and copy it.")),
              );
            }}
          >
            {show("Copy code")}
          </button>
          {qr ? <div className="ac-qr" dangerouslySetInnerHTML={{ __html: qr }} /> : <p className="ac-hint">{show("This backup is long. Use the code.")}</p>}
        </>
      ) : null}
      <label className="ac-field">
        {show("Restore a backup")}
        <textarea value={paste} aria-label={show("Paste backup code")} onChange={(e) => setPaste(e.target.value)} />
      </label>
      <button
        type="button"
        className="ac-quiet"
        onClick={() => {
          void importBackup(paste).then((next) => {
            if (!next) {
              setNote(show("That code did not work."));
              return;
            }
            onSave(next);
            setNote(show("Restored on this device."));
          });
        }}
      >
        {show("Restore on this device")}
      </button>
      {note ? <p className="ac-hint">{note}</p> : null}
    </section>
  );
}
