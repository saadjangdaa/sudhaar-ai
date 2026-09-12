"use client";

import type { Authority, AuthorityAdmin } from "@/lib/admin/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setApproval } from "./actions";
import { Button } from "../../_components/ui/button";
import { Card, CardContent } from "../../_components/ui/card";

export function ApprovalsList({
  pending,
  authorities,
}: {
  pending: AuthorityAdmin[];
  authorities: Authority[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {pending.map((admin) => (
        <ApprovalRow key={admin.id} admin={admin} authorities={authorities} />
      ))}
    </div>
  );
}

function ApprovalRow({ admin, authorities }: { admin: AuthorityAdmin; authorities: Authority[] }) {
  const router = useRouter();
  const [authorityId, setAuthorityId] = useState(authorities[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(status: "approved" | "rejected") {
    setError(null);
    startTransition(async () => {
      const result = await setApproval(admin.id, status, status === "approved" ? authorityId : undefined);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <Card className="hover:transform-none">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="admin-card-title">{admin.fullName}</p>
          <p className="admin-meta">
            {admin.designation ?? "No designation"} · {admin.id.slice(0, 8)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={authorityId}
            onChange={(event) => setAuthorityId(event.target.value)}
            className="h-9 rounded-md border border-[var(--admin-line)] bg-[var(--admin-card)] px-2 text-sm"
          >
            {authorities.map((authority) => (
              <option key={authority.id} value={authority.id}>
                {authority.name}
              </option>
            ))}
          </select>
          <Button size="sm" disabled={pending || !authorityId} onClick={() => run("approved")}>
            Approve
          </Button>
          <Button size="sm" variant="danger" disabled={pending} onClick={() => run("rejected")}>
            Reject
          </Button>
        </div>
      </CardContent>
      {error ? <p className="px-4 pb-4 text-sm text-[var(--admin-danger)]">{error}</p> : null}
    </Card>
  );
}
