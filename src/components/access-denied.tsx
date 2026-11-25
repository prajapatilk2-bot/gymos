import { ShieldAlert } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AccessDenied() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="bg-destructive/10 text-destructive mb-2 flex size-12 items-center justify-center rounded-full">
            <ShieldAlert className="size-6" />
          </div>
          <CardTitle className="text-xl">Access denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to view this module. Contact your
            administrator if you believe this is a mistake.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
