import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";

export const metadata: Metadata = {
  title: "SnappyForms — Your digital SNAP verification assistant",
  description:
    "SnappyForms makes SNAP volunteer verification digital. Fill in your form once, send one link to your organization, and get a signed form back. Free for volunteers and organizations.",
};

export default function Page() {
  return <HomePage />;
}
