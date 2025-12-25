"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
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
  BookOpen,
  ArrowRight,
  MoveUp,
  MoveDown,
  CornerDownLeft,
} from "lucide-react";

export default function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const params = useParams();

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

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-[999] bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200" />

        {/* Modal Content */}
        <Dialog.Content className="fixed left-1/2 top-[15vh] z-[999] w-full max-w-xl -translate-x-1/2 p-4 outline-none animate-in zoom-in-95 slide-in-from-top-4 duration-200">
          <Dialog.Title className="sr-only">Command Menu</Dialog.Title>

          <Command className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col w-full ring-1 ring-slate-900/5 font-sans">
            {/* INPUT AREA */}
            <div className="flex items-center border-b border-slate-100 px-4">
              <Search className="mr-3 h-5 w-5 shrink-0 text-indigo-500" />
              <Command.Input
                placeholder="Type a command or search..."
                className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 font-mono text-[10px] font-bold text-slate-500 shadow-sm">
                  ESC
                </kbd>
              </div>
            </div>

            {/* RESULTS LIST */}
            <Command.List className="max-h-[350px] overflow-y-auto overflow-x-hidden p-2 scroll-smooth">
              <Command.Empty className="py-12 text-center text-sm text-slate-500 font-medium">
                No matching commands found.
              </Command.Empty>

              {/* GROUP: NAVIGATION */}
              <Command.Group
                heading="Navigation"
                className="text-[10px] font-black uppercase text-slate-400 px-2 py-2 tracking-widest"
              >
                <Command.Item
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 aria-selected:bg-indigo-50 aria-selected:text-indigo-700 cursor-pointer transition-all group"
                  onSelect={() => runCommand(() => router.push("/"))}
                >
                  <LayoutDashboard
                    size={18}
                    className="text-slate-400 group-aria-selected:text-indigo-600 transition-colors"
                  />
                  <span>Select Workspace</span>
                  <Shortcut>D</Shortcut>
                </Command.Item>

                <Command.Item
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 aria-selected:bg-indigo-50 aria-selected:text-indigo-700 cursor-pointer transition-all group"
                  onSelect={() => {
                    if (params.id) {
                      runCommand(() =>
                        router.push(`/companies/${params.id}/inventory`)
                      );
                    }
                  }}
                >
                  <Box
                    size={18}
                    className="text-slate-400 group-aria-selected:text-indigo-600 transition-colors"
                  />
                  <span>Inventory Master</span>
                  <Shortcut>I</Shortcut>
                </Command.Item>

                <Command.Item
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 aria-selected:bg-indigo-50 aria-selected:text-indigo-700 cursor-pointer transition-all group"
                  onSelect={() => {
                    if (params.id) {
                      runCommand(() =>
                        router.push(
                          `/companies/${params.id}/reports/sales-register`
                        )
                      );
                    }
                  }}
                >
                  <BookOpen
                    size={18}
                    className="text-slate-400 group-aria-selected:text-indigo-600 transition-colors"
                  />
                  <span>Sales Register</span>
                </Command.Item>

                <Command.Item
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 aria-selected:bg-indigo-50 aria-selected:text-indigo-700 cursor-pointer transition-all group"
                  onSelect={() => {
                    if (params.id) {
                      runCommand(() =>
                        router.push(`/companies/${params.id}/vouchers/verify`)
                      );
                    }
                  }}
                >
                  <CreditCard
                    size={18}
                    className="text-slate-400 group-aria-selected:text-indigo-600 transition-colors"
                  />
                  <span>Pending Verifications</span>
                </Command.Item>
              </Command.Group>

              <Command.Separator className="my-2 h-px bg-slate-100" />

              {/* GROUP: ACTIONS */}
              <Command.Group
                heading="Quick Actions"
                className="text-[10px] font-black uppercase text-slate-400 px-2 py-2 tracking-widest"
              >
                <Command.Item
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 aria-selected:bg-emerald-50 aria-selected:text-emerald-700 cursor-pointer transition-all group"
                  onSelect={() => {
                    if (params.id) {
                      runCommand(() =>
                        router.push(
                          `/companies/${params.id}/vouchers/create?type=SALES`
                        )
                      );
                    }
                  }}
                >
                  <FileText
                    size={18}
                    className="text-slate-400 group-aria-selected:text-emerald-600 transition-colors"
                  />
                  <span>Create Sales Invoice</span>
                  <Shortcut>S</Shortcut>
                </Command.Item>

                <Command.Item
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 aria-selected:bg-emerald-50 aria-selected:text-emerald-700 cursor-pointer transition-all group"
                  onSelect={() => {
                    if (params.id) {
                      runCommand(() =>
                        router.push(
                          `/companies/${params.id}/vouchers/create?type=PAYMENT`
                        )
                      );
                    }
                  }}
                >
                  <Calculator
                    size={18}
                    className="text-slate-400 group-aria-selected:text-emerald-600 transition-colors"
                  />
                  <span>Record Payment</span>
                  <Shortcut>P</Shortcut>
                </Command.Item>
              </Command.Group>

              <Command.Separator className="my-2 h-px bg-slate-100" />

              {/* GROUP: SYSTEM */}
              <Command.Group
                heading="System"
                className="text-[10px] font-black uppercase text-slate-400 px-2 py-2 tracking-widest"
              >
                <Command.Item
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 aria-selected:bg-slate-100 aria-selected:text-slate-900 cursor-pointer transition-all group"
                  onSelect={() => {
                    if (params.id) {
                      runCommand(() =>
                        router.push(`/companies/${params.id}/edit`)
                      );
                    }
                  }}
                >
                  <Settings
                    size={18}
                    className="text-slate-400 group-aria-selected:text-slate-600 transition-colors"
                  />
                  <span>Company Settings</span>
                </Command.Item>

                <Command.Item
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 aria-selected:bg-slate-100 aria-selected:text-slate-900 cursor-pointer transition-all group"
                  onSelect={() => runCommand(() => router.push("/profile"))}
                >
                  <User
                    size={18}
                    className="text-slate-400 group-aria-selected:text-slate-600 transition-colors"
                  />
                  <span>User Profile</span>
                </Command.Item>
              </Command.Group>
            </Command.List>

            {/* FOOTER */}
            <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50 flex justify-end items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
              <div className="flex items-center gap-1">
                <span className="bg-white border border-slate-200 rounded px-1 py-0.5">
                  <MoveUp size={10} />
                </span>
                <span className="bg-white border border-slate-200 rounded px-1 py-0.5">
                  <MoveDown size={10} />
                </span>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="bg-white border border-slate-200 rounded px-1 py-0.5">
                  <CornerDownLeft size={10} />
                </span>
                <span>Select</span>
              </div>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Shortcut({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto text-[10px] font-bold text-slate-400 border border-slate-200 bg-white rounded-md px-1.5 py-0.5 shadow-sm min-w-[20px] text-center font-mono">
      {children}
    </span>
  );
}
