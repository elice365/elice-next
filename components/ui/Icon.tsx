import { IconProps } from "@/types/icon";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { CircleFlag } from "react-circle-flags";
import React, { memo, FC, NamedExoticComponent } from "react";

const IconComponent: FC<IconProps> = ({
  name,
  size = 24,
  color,
  className,
  fill = "none",
}) => {


  if (/^[a-z]{2}$/i.test(name)) {
    return React.createElement(
      CircleFlag,
      {
        countryCode: name.toLowerCase(),
        height: size.toString(),
        className, alt: `Flag of ${name.toUpperCase()}`,
        key: `flag-${name}-${size}`
      }
    );
  }
  const LucideIcon = LucideIcons[name as keyof typeof LucideIcons] as React.ComponentType<LucideProps>;

  if (!LucideIcon) {
    return null;
  }

  return React.createElement(
    LucideIcon,
    {
      size,
      color,
      className,
      fill,
      key: `${name}-${size}-${color}-${fill}`
    }
  );
};

export const Icon: NamedExoticComponent<IconProps> = memo(IconComponent);

