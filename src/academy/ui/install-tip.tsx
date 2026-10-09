import { useEffect, useState } from "react";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallTip() {
  const [promptEvent, setPromptEvent] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as InstallPrompt);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  return (
    <section className="ac-panel ac-install">
      <h2>Add to Home Screen</h2>
      <p>
        The first visit saves the games, pictures, and worksheets on this device. After that, they still open on a plane,
        with the internet off.
      </p>
      <p>On an iPhone or iPad, tap Share, then Add to Home Screen. On Android, open the browser menu and tap Install app or Add to Home Screen.</p>
      {promptEvent && !installed ? (
        <button
          type="button"
          className="ac-go"
          onClick={() => {
            void promptEvent
              .prompt()
              .then(async () => {
                const choice = await promptEvent.userChoice;
                if (choice.outcome === "accepted") setInstalled(true);
                setPromptEvent(null);
              })
              .catch(() => setPromptEvent(null));
          }}
        >
          Install app
        </button>
      ) : null}
      {installed ? <p className="ac-hint">Installed on this device.</p> : null}
    </section>
  );
}
