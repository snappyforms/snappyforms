import { AuthProvider } from "@/AuthContext";
import HoursConfirmation from "@/components/HoursConfirmation";

export default function Page() {
  return (
    <AuthProvider>
      <HoursConfirmation />
    </AuthProvider>
  );
}