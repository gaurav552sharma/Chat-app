import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <label className="flex cursor-pointer gap-2 items-center">
      <span className="label-text">Dark Mode</span>
      <input
        type="checkbox"
        className="toggle toggle-primary"
        onChange={toggleTheme}
        checked={theme === "dark"}
      />
    </label>
  );
};

export default ThemeToggle;
