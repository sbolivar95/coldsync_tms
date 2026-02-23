import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { OrganizationSelector } from "../components/widgets/OrganizationSelector";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface HeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  dropdown?: {
    label: string;
    options?: string[];
  };
  actions?: ReactNode;
  onTitleClick?: () => void;
}

export function Header({ title, breadcrumbs, dropdown, actions, onTitleClick }: HeaderProps) {
  const hasBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;

  return (
    <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center">
      <div className="flex items-center justify-between w-full">
        {/* Lado izquierdo: Título + Breadcrumbs + Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Título - siempre text-base, clickeable si hay breadcrumbs */}
            {title && (
              hasBreadcrumbs && onTitleClick ? (
                <button
                  onClick={onTitleClick}
                  className="text-base font-medium text-gray-500 hover:text-gray-900 hover:underline"
                >
                  {title}
                </button>
              ) : (
                <h1 className="text-base font-medium text-gray-900">{title}</h1>
              )
            )}

            {/* Breadcrumbs */}
            {hasBreadcrumbs && breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const isFirst = index === 0;
              const showSeparator = title || !isFirst; // Show separator if there's a title OR it's not the first breadcrumb

              return (
                <div key={index} className="flex items-center gap-2">
                  {showSeparator && <span className="text-gray-400">›</span>}
                  {isLast ? (
                    // Último nivel - más oscuro y no clickeable
                    <span className="text-base font-medium text-gray-900">{crumb.label}</span>
                  ) : (
                    // Niveles anteriores - más grises y clickeables
                    <button
                      onClick={crumb.onClick}
                      className="text-base font-medium text-gray-500 hover:text-gray-900 hover:underline"
                    >
                      {crumb.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {dropdown && (
            <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
              <span className="text-sm">{dropdown.label}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Lado derecho: Organization Selector (for platform users) + Acciones principales */}
        <div className="flex items-center gap-2">
          <OrganizationSelector />
          {actions}
        </div>
      </div>
    </div>
  );
}