import { useEffect, useState } from "react";

const DashboardNotification = () => {
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:8000/ws`);

    socket.onopen = () => {};

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === "package-purchased") {
        setNotifications((prev) => [...prev, data.data]);

        setTimeout(() => {
          setNotifications((prev) => prev.slice(1));
        }, 5000);
      }
    };

    socket.onclose = () => {};

    return () => socket.close();
  }, []);

  return (
    <div className="mt-24 flex flex-col justify-center items-center gap-2 z-50">
      <div className="border-2 lg:h-40 h-32 m-4 rounded-lg w-full max-w-lg lg:max-w-3xl flex flex-col justify-end items-center p-2">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className=" text-black text-center text-xs sm:text-sm rounded-lg w-full max-w-lg opacity-100 transition-opacity duration-10000 animate-fadeOut"
          >
            🎉 {notification} 🎉
          </div>
        ))}

        {/* Tailwind Keyframes for Fade-Out */}
        <style>
          {`
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-fadeOut {
          animation: fadeOut 10s ease-in-out forwards;
        }
      `}
        </style>
      </div>
    </div>
  );
};

export default DashboardNotification;
