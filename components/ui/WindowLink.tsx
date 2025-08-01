"use client";

interface OpenProps {
  link: string;
  type?: "popup" | "newTab";
  size?: "small" | "medium" | "large" | { width: number; height: number };
  children: React.ReactNode;
  className?: string;
}

export const WindowLink = ({ link, type = "popup", size = "medium", children, className = "" }: OpenProps) => {
  const getSizeConfig = () => {
    if (typeof size === "object") {
      return { width: size.width, height: size.height };
    }
    
    switch (size) {
      case "small":
        return { width: 300, height: 250 };
      case "medium":
        return { width: 500, height: 400 };
      case "large":
        return { width: 800, height: 600 };
      default:
        return { width: 500, height: 400 };
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (type === "popup") {
      const { width, height } = getSizeConfig();
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      window.open(
        link,
        "_blank",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );
    } else {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
};