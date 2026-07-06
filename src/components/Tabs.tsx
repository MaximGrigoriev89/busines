import { CATEGORIES } from "../data";

interface TabsProps {
  active: number;
  onChange: (index: number) => void;
}

export function Tabs({ active, onChange }: TabsProps) {
  return (
    <nav className="tabs" aria-label="Категории бизнесов">
      {CATEGORIES.map((category, index) => (
        <button className={active === index ? "tab active" : "tab"} key={category.name} onClick={() => onChange(index)}>
          <span>{category.icon}</span>
          <span>{category.name}</span>
        </button>
      ))}
    </nav>
  );
}
