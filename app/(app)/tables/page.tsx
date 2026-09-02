"use client";

import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";
import { TablesHome } from "@/components/tables/tables-home";

export default function TablesPage() {
  useSetHeader("Tables", "/");

  return (
    <PageTransition>
      <TablesHome />
    </PageTransition>
  );
}
