"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditLogRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  ipAddress: string | null;
  user: { id: string; name: string; email: string } | null;
  branch: { id: string; name: string } | null;
}

export default function AuditLogPage() {
  const [items, setItems] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [filters, setFilters] = useState({
    entityType: "",
    action: "",
    from: "",
    to: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filters.entityType) params.set("entityType", filters.entityType);
      if (filters.action) params.set("action", filters.action);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);

      const res = await fetch(`/api/v1/audit-log?${params.toString()}`);
      const body = await res.json();
      if (res.ok) {
        setItems(body.items);
        setPageCount(body.pageCount);
      }
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="entityType">Entity type</Label>
          <Input
            id="entityType"
            placeholder="e.g. User"
            value={filters.entityType}
            onChange={(e) => {
              setPage(1);
              setFilters({ ...filters, entityType: e.target.value });
            }}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="action">Action</Label>
          <Input
            id="action"
            placeholder="e.g. update"
            value={filters.action}
            onChange={(e) => {
              setPage(1);
              setFilters({ ...filters, action: e.target.value });
            }}
            className="w-32"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="date"
            value={filters.from}
            onChange={(e) => {
              setPage(1);
              setFilters({ ...filters, from: e.target.value });
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            value={filters.to}
            onChange={(e) => {
              setPage(1);
              setFilters({ ...filters, to: e.target.value });
            }}
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  No audit log entries match these filters.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(item.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{item.user ? item.user.name : "System"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.action}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.entityType}
                    {item.entityId ? (
                      <span className="text-muted-foreground ml-1 font-mono text-xs">
                        {item.entityId.slice(0, 8)}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>{item.branch?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.ipAddress ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <span>
          Page {page} of {pageCount}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
