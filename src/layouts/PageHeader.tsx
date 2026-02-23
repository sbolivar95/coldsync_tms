import { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "../components/ui/Input";

interface PageHeaderProps {
  tabs?: { id: string; label: string; active: boolean; onClick: () => void; badge?: number }[];
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearch?: (value: string) => void;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({
  tabs,
  showSearch,
  searchPlaceholder = "Search",
  searchValue,
  onSearch,
  filters,
  actions,
}: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      {/* Tabs con underline */}
      {tabs && tabs.length > 0 && (
        <div className="px-6">
          <div className="flex items-center gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={tab.onClick}
                className={`pb-3 pt-3 border-b-2 transition-colors text-sm flex items-center ${tab.active
                  ? "text-gray-900 border-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${tab.active
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-700"
                    }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros y controles */}
      {(showSearch || filters || actions) && (
        <div className="px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            {/* Búsqueda */}
            {showSearch && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  className="pl-10 h-9"
                  value={searchValue}
                  onChange={(e) => onSearch?.(e.target.value)}
                />
              </div>
            )}

            {/* Filtros personalizados */}
            {filters}
          </div>

          {/* Acciones a la derecha */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}