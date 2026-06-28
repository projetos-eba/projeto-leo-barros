import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";
import { toast as sonnerToast } from "@/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

import { AppProviders } from "./providers";

function ProviderTestHarness() {
  const { toast } = useToast();

  return (
    <>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <Button>Tooltip trigger</Button>
        </TooltipTrigger>
        <TooltipContent>Tooltip disponível</TooltipContent>
      </Tooltip>

      <Button
        onClick={() =>
          toast({
            title: "Toast shadcn disponível",
          })
        }
      >
        Abrir toast shadcn
      </Button>

      <Button onClick={() => sonnerToast.success("Sonner disponível")}>
        Abrir Sonner
      </Button>
    </>
  );
}

describe("AppProviders", () => {
  it("renderiza children e Tooltip dentro da árvore global", async () => {
    render(
      <AppProviders>
        <ProviderTestHarness />
      </AppProviders>,
    );

    expect(screen.getByRole("button", { name: "Tooltip trigger" })).toBeInTheDocument();
    expect((await screen.findAllByText("Tooltip disponível")).length).toBeGreaterThan(0);
  });

  it("renderiza o toast shadcn disparado por um child", async () => {
    render(
      <AppProviders>
        <ProviderTestHarness />
      </AppProviders>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Abrir toast shadcn" }));

    expect(await screen.findByText("Toast shadcn disponível")).toBeInTheDocument();
  });

  it("renderiza o Sonner disparado por um child", async () => {
    render(
      <AppProviders>
        <ProviderTestHarness />
      </AppProviders>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Abrir Sonner" }));

    await waitFor(() => {
      expect(screen.getByText("Sonner disponível")).toBeInTheDocument();
    });
  });
});
