const TableLoading = () => {
  return (
    <div
      className={`bloc absolute inset-0 bg-cardColor/70 dark:bg-zinc-800/70 z-50 transition-opacity duration-300`}
    >
      <div className="absolute top-1/2 left-1/2">
        <div className="relative flex items-center justify-center">
          {/* Animated SVG */}
          <svg
            style={{
              left: "50%",
              top: "50%",
              position: "absolute",
              transform: "translate(-50%, -50%)",
            }}
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 187.3 93.7"
            height="150px"
            width="200px"
          >
            {/* Outline Path Animation */}
            <path
              d="M93.9,46.4c9.3,9.5,13.8,17.9,23.5,17.9s17.5-7.8,17.5-17.5s-7.8-17.6-17.5-17.5c-9.7,0.1-13.3,7.2-22.1,17.1 				c-8.9,8.8-15.7,17.9-25.4,17.9s-17.5-7.8-17.5-17.5s7.8-17.5,17.5-17.5S86.2,38.6,93.9,46.4z"
              strokeMiterlimit="10"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="4"
              fill="none"
              id="outline"
              stroke="#0ea5e9"
              className="animate-stroke-anim"
            ></path>

            {/* Background Path (Faint Static) */}
            <path
              d="M93.9,46.4c9.3,9.5,13.8,17.9,23.5,17.9s17.5-7.8,17.5-17.5s-7.8-17.6-17.5-17.5c-9.7,0.1-13.3,7.2-22.1,17.1 				c-8.9,8.8-15.7,17.9-25.4,17.9s-17.5-7.8-17.5-17.5s7.8-17.5,17.5-17.5S86.2,38.6,93.9,46.4z"
              strokeMiterlimit="10"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="4"
              stroke="#0ea5e9"
              fill="none"
              opacity="0.05"
              id="outline-bg"
            ></path>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TableLoading;
