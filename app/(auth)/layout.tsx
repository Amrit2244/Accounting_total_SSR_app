export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // We return the children directly.
  // This removes the "centered box" restriction, allowing
  // the Login/Register pages to use the full 100% width of the screen.
  return <>{children}</>;
}
