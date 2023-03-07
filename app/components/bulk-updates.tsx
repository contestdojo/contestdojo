/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { CollectionReference, UpdateData } from "firebase-admin/firestore";
import type { EventCustomField } from "~/lib/db.server";

import { Dialog } from "@headlessui/react";
import { ArrowUpTrayIcon, CheckIcon } from "@heroicons/react/24/outline";
import { parse } from "csv/browser/esm";
import { useMemo } from "react";
import { z } from "zod";

import { SchemaForm } from "~/components/schema-form";
import { Modal, Table, Tbody, Td, Th, Thead, Tr } from "~/components/ui";
import { firestore } from "~/lib/firebase.server";
import { filterEntries, filterValues, getNestedPath } from "~/lib/utils/object-utils";

import { guardType } from "./schema-form/guards";

function parseCsv(val: unknown) {
  return new Promise((resolve, reject) => {
    parse(`${val}`, { columns: true }, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

function transformCsv(val: unknown, ctx: z.RefinementCtx) {
  return parseCsv(val).catch((err) => {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: err.message,
    });
    return z.NEVER;
  });
}

function transformWithSchema<T>(schema: z.ZodSchema<T>) {
  return (val: unknown, ctx: z.RefinementCtx) =>
    schema.parseAsync(val).catch((err: z.ZodError) => {
      for (const issue of err.issues) {
        ctx.addIssue({
          ...issue,
          message: `[${issue.path[0]}].${issue.path[1]}: ${issue.message}`,
          path: undefined,
        });
      }
      return z.NEVER;
    });
}

export function BulkUpdateForm<S extends z.ZodRawShape, T extends z.ZodObject<S>>(
  baseSchema: T,
  customFields: EventCustomField[] | undefined
) {
  const customFieldsShape: { [k in `customFields.${string}`]: z.ZodOptional<z.ZodString> } = {};
  for (const x of customFields ?? []) {
    customFieldsShape[`customFields.${x.id}`] = z.string().optional();
  }

  const rowSchema = z.object(customFieldsShape).merge(baseSchema).setKey("id", z.string()).strict();

  return z.object({
    csv: z
      .string()
      .transform(transformCsv)
      .transform(transformWithSchema(z.array(rowSchema))),
  });
}

export function runBulkUpdate<T>(
  collectionRef: CollectionReference<T>,
  rows: { id: string; [key: string]: any }[]
) {
  return firestore.runTransaction((t) =>
    Promise.all(
      rows.map(async ({ id, ...row }) => {
        const ref = collectionRef.doc(id);
        const doc = await t.get(ref);
        const update = filterEntries(row, (x) => x !== undefined);
        if (doc.exists) t.update(ref, update as UpdateData<T>);
        return { id, update, data: doc.data() };
      })
    )
  );
}

export type BulkActionResult<T> = {
  id: string;
  update: Record<string, string | undefined>;
  data?: T | undefined;
}[];

export type BulkUpdateActionData<T> = {
  _form: "BulkUpdate";
  result: BulkActionResult<T>;
};

export type BulkUpdateModalProps<S extends z.ZodRawShape, T extends z.ZodObject<S>, U> = {
  baseSchema: T;
  customFields: EventCustomField[];
  result?: BulkActionResult<U>;
  RowHeader: (props: { data: U }) => JSX.Element;
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function BulkUpdateModal<S extends z.ZodRawShape, T extends z.ZodObject<S>, U>({
  baseSchema,
  customFields,
  result,
  RowHeader,
  open,
  setOpen,
}: BulkUpdateModalProps<S, T, U>) {
  const form = useMemo(() => BulkUpdateForm(baseSchema, customFields), [baseSchema, customFields]);

  if (result) {
    return (
      <Modal open={open} setOpen={setOpen} className="flex max-w-4xl flex-col gap-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
        </div>

        <Dialog.Title as="h3" className="text-center text-lg font-medium text-gray-900">
          Bulk update successful
        </Dialog.Title>

        <div className="overflow-auto rounded-lg shadow ring-1 ring-black ring-opacity-5">
          <Table>
            <Thead>
              <Tr>
                <Th>Entity</Th>
                {Object.keys(result[0].update).map((x) => (
                  <Th key={x}>{x}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {result.map(({ id, update, data }) => (
                <Tr key={id}>
                  <Td>{data ? <RowHeader data={data} /> : id}</Td>
                  {data ? (
                    Object.entries(update).map(([k, v]) => (
                      <Td key={k}>
                        <div className="flex items-center gap-2">
                          {getNestedPath(data, k) === v ? (
                            v
                          ) : (
                            <>
                              {getNestedPath(data, k) && (
                                <span className="text-red-300 line-through">
                                  {getNestedPath(data, k)}
                                </span>
                              )}
                              <span className="text-green-500">{v}</span>
                            </>
                          )}
                        </div>
                      </Td>
                    ))
                  ) : (
                    <Td className="font-medium text-red-500" colSpan={Object.keys(update).length}>
                      Not Found
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      </Modal>
    );
  }

  const requiredFields = [
    "id",
    ...Object.keys(filterValues(baseSchema.shape, (x) => !guardType.ZodOptional(x))),
  ];

  const optionalFields = [
    ...customFields.map((x) => `customFields.${x.id}`),
    ...Object.keys(filterValues(baseSchema.shape, guardType.ZodOptional)),
  ];

  return (
    <Modal open={open} setOpen={setOpen} className="flex max-w-4xl flex-col gap-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <ArrowUpTrayIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-2">
        <Dialog.Title as="h3" className="text-center text-lg font-medium text-gray-900">
          Bulk Update
        </Dialog.Title>

        <p className="flex flex-row items-center gap-2 text-sm text-gray-500">
          <span>Required fields:</span>
          {requiredFields.map((x) => (
            <span key={x} className="rounded bg-gray-200 px-1 font-mono">
              {x}
            </span>
          ))}
        </p>

        <p className="flex flex-row items-center gap-2 text-sm text-gray-500">
          <span>Accepted fields:</span>
          {optionalFields.map((x) => (
            <span key={x} className="rounded bg-gray-200 px-1 font-mono">
              {x}
            </span>
          ))}
        </p>
      </div>

      <SchemaForm
        id="BulkUpdate"
        method="post"
        schema={form}
        buttonLabel="Update"
        fieldProps={{ csv: { label: "CSV Text", multiline: true } }}
      />
    </Modal>
  );
}
