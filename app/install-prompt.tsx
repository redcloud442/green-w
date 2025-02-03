"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  /* eslint-disable */
  // Code block

  useEffect(() => {
    // Check if the app is already installed
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    // Check if the device is iOS
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as unknown as { MSStream: any }).MSStream
    );

    // Listen for the `beforeinstallprompt` event on Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent the automatic prompt
      setDeferredPrompt(e); // Store the event for manual triggering
      setShowInstallButton(true); // Show the custom install button
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      //@ts-expect-error
      deferredPrompt.prompt(); // Show the native install prompt
      //@ts-expect-error
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        } else {
          console.log("User dismissed the install prompt");
        }
        setDeferredPrompt(null); // Clear the prompt after interaction
        setShowInstallButton(false);
      });
    }
  };

  // Don't show the install button if already installed
  if (isStandalone) {
    return null;
  }

  return (
    <div className="p-4 bg-blue-100 rounded-md">
      <h3 className="text-xl font-semibold mb-2">Install Our App</h3>
      {showInstallButton && (
        <button
          onClick={handleInstallClick}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Install App on Android
        </button>
      )}

      {isIOS && (
        <p className="mt-2">
          To install this app on your iOS device, tap the share button
          <span role="img" aria-label="share icon">
            {" "}
            ⎋{" "}
          </span>{" "}
          and select &quot;Add to Home Screen&quot;
          <span role="img" aria-label="plus icon">
            {" "}
            ➕{" "}
          </span>
          .
        </p>
      )}
    </div>

    /* eslint-enable */
  );
}
