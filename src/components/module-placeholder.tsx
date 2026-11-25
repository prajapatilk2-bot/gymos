import { Construction } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ModuleDefinition } from "@/server/modules/registry";

export function ModulePlaceholder({
  module: moduleDef,
}: {
  module: ModuleDefinition;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="items-center text-center">
          <div className="bg-muted text-muted-foreground mb-2 flex size-12 items-center justify-center rounded-full">
            <Construction className="size-6" />
          </div>
          <Badge variant="secondary" className="mb-2">
            Module {moduleDef.id}
          </Badge>
          <CardTitle className="text-xl">{moduleDef.name}</CardTitle>
          <CardDescription className="text-base">
            {moduleDef.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Badge variant="outline">Planned for Phase {moduleDef.phase}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
