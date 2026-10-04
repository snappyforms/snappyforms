import { AuthProvider } from "@/AuthContext";
import RequirementCheck from "@/components/RequirementCheck";

export default function Page() {
  return (
    <AuthProvider>
      <RequirementCheck />
    </AuthProvider>
  );
}