/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { DragEndEvent } from "@dnd-kit/core";
import type { ZodArray, ZodTypeAny } from "zod";
import type { FromZodProps } from "~/components/forms/schema-form/from-zod";

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
import { useFieldArray } from "remix-validated-form";
import { v4 as uuidv4 } from "uuid";

import Button from "~/components/button";
import FromZod from "~/components/forms/schema-form/from-zod";
import IconButton from "~/components/icon-button";

type ArrayItemProps<T extends ZodTypeAny> = FromZodProps<T> & {
  sortableId: string;
  onRemove: () => void;
};

function ArrayItem<T extends ZodTypeAny>({ sortableId, onRemove, ...props }: ArrayItemProps<T>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      className={`flex flex-col gap-5 md:flex-row ${isDragging && "z-10"}`}
      ref={setNodeRef}
      style={style}
    >
      <FromZod {...props} />

      <div className="flex items-center gap-4 self-center md:flex-col">
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

export function FromZodArray<T extends ZodTypeAny>({
  name,
  fieldProps,
  type,
}: FromZodProps<ZodArray<T>>) {
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
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {items.map((item, index) => (
          <ArrayItem
            key={item.__sortableId ?? item.id}
            sortableId={item.__sortableId ?? item.id}
            onRemove={() => remove(index)}
            name={`${name}[${index}]`}
            type={type.element}
            fieldProps={fieldProps}
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
