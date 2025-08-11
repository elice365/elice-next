export interface Dropdown {
  key: string;
  icon?: string;
  label: string;
  content?: string;
  date?:Date;
  isSelected?: boolean;
}

export interface DropdownProps {
  currentIcon: string;
  options: Dropdown[];
  className?:string;
  direction: "left-0" | "right-0"
  onSelect?: (key: string) => void;
  ariaLabel: string;
}