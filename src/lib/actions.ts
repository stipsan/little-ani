"use server";

import { client } from "@/lib/sanity";
import { type EntryDocument, AutoEntry, ManualEntry } from "@/types/entry";
import { randomUUID } from "node:crypto";

export async function getActiveEntry(): Promise<EntryDocument | null> {
  const query = `*[_type == "entry" && status == "active" && mode == "auto"][0]`;
  return client.fetch(query);
}

export async function getLatestOutsideEntry(): Promise<EntryDocument | null> {
  const query = `*[_type == "entry" && location == "outside"] | order(startTime desc) [0]`;
  return client.fetch(query);
}

export async function addManualEntry(entry: ManualEntry) {
  const validatedEntry = ManualEntry.safeParse(entry);
  if (!validatedEntry.success) {
    throw new Error("Invalid entry data");
  }

  const newDocument: EntryDocument = {
    _id: randomUUID(),
    _type: "entry",
    status: "completed",
    mode: "manual",
    ...validatedEntry.data,
  };

  await client.create(newDocument);
}

export async function startEntry() {
  const newDocument: EntryDocument = {
    _id: randomUUID(),
    _type: "entry",
    startTime: new Date().toISOString(),
    status: "active",
    mode: "auto",
    location: "outside",
  };

  return client.create(newDocument);
}

export async function updateEntry(entryId: string, entry: AutoEntry) {
  const validatedEntry = AutoEntry.safeParse(entry);
  if (!validatedEntry.success) {
    throw new Error("Invalid entry data");
  }

  const existingEntry = await client.getDocument<EntryDocument>(entryId);
  if (!existingEntry) {
    throw new Error("Entry not found");
  }

  const updatedEntry: EntryDocument = {
    ...existingEntry,
    ...validatedEntry.data,
    status: "completed",
  };

  await client.createOrReplace(updatedEntry);
}
