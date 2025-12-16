"use client";

import { useActionState } from "react";
import { createStockItem } from "@/app/actions/masters"; // We need to add this action later if missing!
import SubmitButton from "@/components/SubmitButton"; // Ensure you have this component
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the type for the groups passed from the page
type Group = {
  id: number;
  name: string;
};

export default function InventoryForm({
  companyId,
  groups,
}: {
  companyId: number;
  groups: Group[];
}) {
  const [state, action] = useActionState(createStockItem, {
    message: null,
    errors: {},
  });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="companyId" value={companyId} />

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">Item Name</Label>
        <Input id="name" name="name" placeholder="e.g. Wireless Mouse" />
        {state?.errors?.name && (
          <p className="text-sm text-red-500">{state.errors.name[0]}</p>
        )}
      </div>

      {/* Group Selection */}
      <div className="space-y-2">
        <Label htmlFor="groupId">Stock Group</Label>
        <Select name="groupId">
          <SelectTrigger>
            <SelectValue placeholder="Select Group" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state?.errors?.groupId && (
          <p className="text-sm text-red-500">{state.errors.groupId[0]}</p>
        )}
      </div>

      {/* Opening Balance */}
      <div className="space-y-2">
        <Label htmlFor="openingBalance">Opening Quantity</Label>
        <Input
          type="number"
          id="openingBalance"
          name="openingBalance"
          defaultValue={0}
        />
      </div>

      <div className="pt-4">
        <SubmitButton />
      </div>

      {state?.message && (
        <p className="text-red-500 text-center text-sm">{state.message}</p>
      )}
    </form>
  );
}
