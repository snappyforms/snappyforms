import type { Metadata } from "next";
import ProductionMvpDemo from "@/components/demo/ProductionMvpDemo";

export const metadata: Metadata = {
  title: "Production MVP Preview | SnappyForms",
  description:
    "A frontend-only preview of the SnappyForms volunteer intake and organization review workflow.",
};

export default function DemoPage() {
  return <ProductionMvpDemo />;
}
