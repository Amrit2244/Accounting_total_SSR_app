"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Calculator,
  CreditCard,
  Settings,
  User,
  FileText,
  LayoutDashboard,
  Box,
  Search,
  BookOpen, // ✅ Added Icon
} from "lucide-react";

export default function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  // Toggle the menu when ⌘K or Ctrl+K is pressed
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Helper to handle navigation and close
  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        {/* 1. The Backdrop Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" />

        {/* 2. The Modal Content */}
        <Dialog.Content className="fixed left-1/2 top-[15vh] z-[999] w-full max-w-2xl -translate-x-1/2 p-4 outline-none animate-in zoom-in-95 slide-in-from-top-4 duration-200">
          {/* ✅ ACCESSIBILITY FIX: Hidden Title */}
          <Dialog.Title className="sr-only">Global Command Menu</Dialog.Title>

          {/* 3. The Command Interface */}
          <Command className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col w-full">
            {/* INPUT AREA */}
            <div className="flex items-center border-b border-slate-100 px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input
                placeholder="Type a command or search..."
                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 font-medium"
              />
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100">
                  <span className="text-xs">ESC</span>
                </kbd>
              </div>
            </div>

            {/* RESULTS LIST */}
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
              <Command.Empty className="py-6 text-center text-sm text-slate-500">
                No results found.
              </Command.Empty>

              {/* GROUP: NAVIGATION */}
              <Command.Group
                heading="Go to..."
                className="text-[10px] font-black uppercase text-slate-400 px-2 py-1.5 mb-1 tracking-widest"
              >
                <Command.Item
                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors aria-selected:bg-blue-50 aria-selected:text-blue-700 group"
                  onSelect={() => runCommand(() => router.push("/"))}
                >
                  <LayoutDashboard
                    size={14}
                    className="text-slate-400 group-aria-selected:text-blue-600"
                  />
                  <span>Select Company</span>
                  <Shortcut>D</Shortcut>
                </Command.Item>

                <Command.Item
                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors aria-selected:bg-blue-50 aria-selected:text-blue-700 group"
                  onSelect={() =>
                    runCommand(() => router.push("/companies/1/inventory"))
                  }
                >
                  <Box
                    size={14}
                    className="text-slate-400 group-aria-selected:text-blue-600"
                  />
                  <span>Inventory Master</span>
                  <Shortcut>I</Shortcut>
                </Command.Item>

                {/* ✅ ADDED: Sales Register */}
                <Command.Item
                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors aria-selected:bg-blue-50 aria-selected:text-blue-700 group"
                  onSelect={() =>
                    runCommand(() =>
                      router.push("/companies/1/reports/sales-register")
                    )
                  }
                >
                  <BookOpen
                    size={14}
                    className="text-slate-400 group-aria-selected:text-blue-600"
                  />
                  <span>Sales Register</span>
                </Command.Item>

                <Command.Item
                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors aria-selected:bg-blue-50 aria-selected:text-blue-700 group"
                  onSelect={() =>
                    runCommand(() =>
                      router.push("/companies/1/vouchers/verify")
                    )
                  }
                >
                  <CreditCard
                    size={14}
                    className="text-slate-400 group-aria-selected:text-blue-600"
                  />
                  <span>Verification Pending</span>
                </Command.Item>
              </Command.Group>

              <Command.Separator className="my-1 h-px bg-slate-100" />

              {/* GROUP: ACTIONS */}
              <Command.Group
                heading="Quick Actions"
                className="text-[10px] font-black uppercase text-slate-400 px-2 py-1.5 mb-1 mt-2 tracking-widest"
              >
                <Command.Item
                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors aria-selected:bg-emerald-50 aria-selected:text-emerald-700 group"
                  onSelect={() =>
                    runCommand(() =>
                      router.push("/companies/1/vouchers/create?type=SALES")
                    )
                  }
                >
                  <FileText
                    size={14}
                    className="text-slate-400 group-aria-selected:text-emerald-600"
                  />
                  <span>Create Sales Invoice</span>
                  <Shortcut>S</Shortcut>
                </Command.Item>

                <Command.Item
                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors aria-selected:bg-emerald-50 aria-selected:text-emerald-700 group"
                  onSelect={() =>
                    runCommand(() =>
                      router.push("/companies/1/vouchers/create?type=PAYMENT")
                    )
                  }
                >
                  <Calculator
                    size={14}
                    className="text-slate-400 group-aria-selected:text-emerald-600"
                  />
                  <span>Record Payment</span>
                  <Shortcut>P</Shortcut>
                </Command.Item>
              </Command.Group>

              <Command.Separator className="my-1 h-px bg-slate-100" />

              {/* GROUP: SYSTEM */}
              <Command.Group
                heading="System"
                className="text-[10px] font-black uppercase text-slate-400 px-2 py-1.5 mb-1 mt-2 tracking-widest"
              >
                <Command.Item
                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors aria-selected:bg-slate-100"
                  onSelect={() => runCommand(() => router.push("/settings"))}
                >
                  <Settings size={14} className="text-slate-400" />
                  <span>Settings</span>
                </Command.Item>
                <Command.Item
                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors aria-selected:bg-slate-100"
                  onSelect={() => runCommand(() => router.push("/profile"))}
                >
                  <User size={14} className="text-slate-400" />
                  <span>Profile</span>
                </Command.Item>
              </Command.Group>
            </Command.List>

            <div className="border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400 flex justify-between items-center bg-slate-50/50">
              <span>
                Use <kbd className="font-sans font-bold text-slate-500">↑↓</kbd>{" "}
                to navigate
              </span>
              <span>
                Press{" "}
                <kbd className="font-sans font-bold text-slate-500">↵</kbd> to
                select
              </span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Shortcut({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto text-[10px] tracking-widest text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-white font-bold">
      {children}
    </span>
  );
}
