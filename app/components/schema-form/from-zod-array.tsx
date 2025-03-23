/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { DragEndEvent } from "@dnd-kit/core";
import type { ZodArray, ZodTypeAny } from "zod";
import type { FieldProps, FromZodProps, Overrides } from "./from-zod";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon, TrashIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useFieldArray } from "remix-validated-form";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

import { Button, IconButton, Label } from "~/components/ui";

import { FromZod } from "./from-zod";

type ArrayItemProps<T extends ZodTypeAny> = FromZodProps<T> & {
  sortableId: string;
  onRemove: () => void;
  className?: string;
};

function ArrayItem<T extends ZodTypeAny>({
  sortableId,
  onRemove,
  className,
  ...props
}: ArrayItemProps<T>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div className={clsx`flex gap-5 ${isDragging && "z-10"}`} style={style} ref={setNodeRef}>
      <div className={twMerge("flex flex-1 flex-col gap-5", className)}>
        <FromZod {...props} />
      </div>

      <div className="flex flex-col items-center gap-4">
        <IconButton type="button" {...attributes} {...listeners}>
          <Bars3Icon className="h-4 w-4" />
        </IconButton>
        <IconButton type="button" onClick={onRemove}>
          <TrashIcon className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}

export type ArrayFieldProps<T extends ZodArray<ZodTypeAny>> = {
  label?: string;
  elementClassName?: string;
  element?: FieldProps<T["element"]>;
};

export type ArrayOverrides<T extends ZodArray<ZodTypeAny>> = {
  element?: Overrides<T["element"]>;
};

export function FromZodArray<T extends ZodArray<ZodTypeAny>>({
  name,
  fieldProps,
  overrides,
  type,
}: FromZodProps<T>) {
  const [items, { push, move, remove }, error] = useFieldArray(name);
  const itemIds = items.map((x) => x.__sortableId ?? x.id);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const from = itemIds.indexOf(active.id);
    const to = itemIds.indexOf(over?.id);
    if (from > -1 && to > -1) move(from, to);
  };

  return (
    <DndContext
      id={`dnd-array-${name}`}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {fieldProps?.label && <Label>{fieldProps.label}</Label>}

      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {items.map((item, index) => (
          <ArrayItem
            key={item.__sortableId ?? item.id}
            sortableId={item.__sortableId ?? item.id}
            onRemove={() => remove(index)}
            name={`${name}[${index}]`}
            type={type.element}
            fieldProps={fieldProps?.element}
            overrides={overrides?.element}
            className={fieldProps?.elementClassName}
          />
        ))}
      </SortableContext>

      <div className="flex items-center gap-5">
        <Button type="button" onClick={() => push({ __sortableId: uuidv4() })}>
          Add Item
        </Button>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </DndContext>
  );
}
