"use client";

import type { ResolvedEntryDocument } from "@/types/entry";
import { useTimer } from "../hooks/useTimer";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { firstName } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface TimerProps {
  entry: ResolvedEntryDocument;
}

export const Timer = ({ entry }: TimerProps) => {
  const elapsedTime = useTimer(entry.startTime);
  const hasUsers = Boolean(entry?.users?.length);

  return (
    <div className="flex flex-col items-center">
      <motion.p
        className="flex items-center mb-4 text-sm font-medium flex-wrap justify-center max-w-sm min-h-9"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={hasUsers ? "visible" : "hidden"}
      >
        <AnimatePresence initial={false}>
          {entry?.users?.map((user, index, array) => (
            <motion.span
              key={user.email}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="flex items-center"
            >
              <Badge
                key={user.email}
                variant="outline"
                className="text-md gap-1 pr-1.5 mx-0.5"
              >
                <Avatar className="size-6">
                  <AvatarImage src={user.image ?? undefined} />
                </Avatar>
                {firstName(user.name)}
              </Badge>
              {index < array.length - 2 && <span>,&nbsp;</span>}
              {index === array.length - 2 && <span>&nbsp;og&nbsp;</span>}
            </motion.span>
          ))}
        </AnimatePresence>
        <span>&nbsp;er på tur</span>
      </motion.p>

      <p className="text-7xl tabular-nums font-medium mb-4">{elapsedTime}</p>
    </div>
  );
};
