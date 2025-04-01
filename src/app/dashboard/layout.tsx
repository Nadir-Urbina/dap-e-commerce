import DashboardLayout from "./client-layout";

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 