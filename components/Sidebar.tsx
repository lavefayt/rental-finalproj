"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Users,
  Home,
  CheckCircle,
  XCircle,
  DoorOpen,
  Menu,
  X,
  ChevronLeft,
  Building2,
} from "lucide-react";
import { Button } from "./ui/button";

interface SidebarProps {
  selectedView: string;
  onViewChange: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

export function Sidebar({
  selectedView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "tenants",
    "rooms",
  ]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      id: "rooms",
      label: "Rooms",
      icon: <Home className="w-5 h-5" />,
      children: [
        {
          id: "all-rooms",
          label: "All Rooms",
          icon: <Home className="w-4 h-4" />,
        },
        {
          id: "vacant",
          label: "Vacant",
          icon: <DoorOpen className="w-4 h-4" />,
        },
        {
          id: "occupied",
          label: "Occupied",
          icon: <CheckCircle className="w-4 h-4" />,
        },
      ],
    },
    {
      id: "tenants",
      label: "Tenants",
      icon: <Users className="w-5 h-5" />,
      children: [
        {
          id: "all-tenants",
          label: "All Tenants",
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: "fully-paid",
          label: "Fully Paid",
          icon: <CheckCircle className="w-4 h-4" />,
        },
        {
          id: "not-fully-paid",
          label: "Not Fully Paid",
          icon: <XCircle className="w-4 h-4" />,
        },
      ],
    },
  ];

  const toggleSection = (sectionId: string) => {
    if (isCollapsed) {
      onToggleCollapse();
    }
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleItemClick = (itemId: string) => {
    onViewChange(itemId);
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* App Title Header */}
      <div className="p-4 border-b border-slate-200">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-slate-700" />
              <div>
                <h1 className="text-slate-900 text-lg">Property Management</h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="hidden md:flex"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="hidden md:flex"
              title="Property Management"
            >
              <Building2 className="w-6 h-6 text-slate-700" />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Header */}
      {!isCollapsed && (
        <div className="p-3 border-b border-slate-100">
          <span className="text-slate-500 text-xs uppercase tracking-wider">
            Navigation
          </span>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => toggleSection(item.id)}
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center" : "justify-between"
              } p-2 rounded-lg hover:bg-slate-100 transition-colors`}
              title={isCollapsed ? item.label : undefined}
            >
              <div
                className={`flex items-center ${
                  isCollapsed ? "" : "gap-2"
                } text-slate-700`}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </div>
              {!isCollapsed && (
                <>
                  {expandedSections.includes(item.id) ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                </>
              )}
            </button>

            {!isCollapsed &&
              expandedSections.includes(item.id) &&
              item.children && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => handleItemClick(child.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                        selectedView === child.id
                          ? "bg-blue-100 text-blue-700"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {child.icon}
                      <span className="text-sm">{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen bg-white border-r border-slate-200 z-40 transition-all duration-300
          ${
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
          ${isCollapsed ? "md:w-16" : "w-64"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
