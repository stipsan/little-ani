import type { ManualEntry, AutoEntry, EntryDocument } from "@/types/entry";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Input } from "@/components/ui/input";
import { addManualEntry, updateEntry } from "@/lib/actions";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

interface SubmitDialogProps {
  entry: EntryDocument | null;
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const SubmitDialog = ({
  entry,
  open,
  onClose,
  onSubmit,
}: SubmitDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState("inside");

  const formatTimeToHtmlInput = useCallback((date?: string) => {
    return new Date(date || new Date()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatTimeToDate = useCallback((time?: string) => {
    const currentDate = new Date().toISOString().split("T")[0];
    return new Date(`${currentDate}T${time}:00`).toISOString();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    const data = {
      startTime: formatTimeToDate(formData.get("startTime") as string),
      endTime: formatTimeToDate(formData.get("endTime") as string),
      poops: Number(formData.get("poops") || 0),
      pees: Number(formData.get("pees") || 0),
      location: entry ? undefined : location, // Only set location if it's a manual entry
    };

    console.log(data);

    if (entry) {
      await updateEntry(entry._id, data as AutoEntry);
    } else {
      await addManualEntry(data as ManualEntry);
    }

    setIsLoading(false);
    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-4 max-w-sm !w-[90dvw]">
        <DialogHeader className="mb-1">
          <DialogDescription>
            {entry
              ? "Legg til informasjon om turen"
              : "Legg til informasjon om turen manuelt"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {!entry && (
            <fieldset className="mb-4 flex flex-col gap-2 items-center">
              <label htmlFor="location" className="text-sm font-medium">
                Hvor var Billy?
              </label>
              <Tabs
                defaultValue={location}
                onValueChange={(value) => setLocation(value)}
              >
                <TabsList>
                  <TabsTrigger value="inside">Inne</TabsTrigger>
                  <TabsTrigger value="outside">Ute</TabsTrigger>
                </TabsList>
              </Tabs>
            </fieldset>
          )}

          <div className="mb-4 flex flex-col gap-2 items-center">
            <label htmlFor="pees" className="text-sm font-medium">
              Hvor mange ganger tissa Billy?
            </label>
            <NumberInput
              id="pees"
              name="pees"
              required
              min={0}
              step={0.1}
              defaultValue={entry?.pees || 0}
              autoFocus={false}
            />
          </div>

          <div className="mb-4 flex flex-col gap-2 items-center">
            <label htmlFor="poops" className="text-sm font-medium">
              Hvor mange ganger bæsja han?
            </label>
            <NumberInput
              id="poops"
              name="poops"
              required
              min={0}
              step={0.1}
              defaultValue={entry?.pees || 0}
              autoFocus={false}
            />
          </div>

          <fieldset className="mb-4 grid gap-3 grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="startTime" className="text-sm font-medium">
                Start tid
              </label>
              <Input
                id="startTime"
                name="startTime"
                required
                type="time"
                defaultValue={formatTimeToHtmlInput(entry?.startTime)}
                autoFocus={false}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="startTime" className="text-sm font-medium">
                Slutt tid
              </label>
              <Input
                id="endTime"
                name="endTime"
                required
                type="time"
                defaultValue={formatTimeToHtmlInput(entry?.endTime)}
                autoFocus={false}
              />
            </div>
          </fieldset>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lagre tur
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
