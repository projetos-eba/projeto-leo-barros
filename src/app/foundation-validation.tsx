"use client";

import { Button } from "@/components/ui/button";
import { toast as sonnerToast } from "@/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

export function FoundationValidation() {
  const { toast } = useToast();

  return (
    <div className="mt-8 flex flex-wrap gap-3" aria-label="Validação da fundação">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Validar Tooltip</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tooltip conectado ao provider global.</p>
        </TooltipContent>
      </Tooltip>

      <Button
        variant="outline"
        onClick={() =>
          toast({
            title: "Toast shadcn funcionando",
            description: "O provider global recebeu o evento corretamente.",
          })
        }
      >
        Validar toast shadcn
      </Button>

      <Button
        className="btn-primary"
        onClick={() =>
          sonnerToast.success("Sonner funcionando", {
            description: "O toaster global está disponível no Next.js.",
          })
        }
      >
        Validar Sonner
      </Button>
    </div>
  );
}
