export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100">
      {/* This wrapper ensures the card is centered and visible */}
      <div className="w-full max-w-md p-4">{children}</div>
    </div>
  );
}
