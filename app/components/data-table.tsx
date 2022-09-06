/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ColumnDef, RowData, Table, TableState } from "@tanstack/react-table";

import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { CSVLink } from "react-csv";
import { ClientOnly } from "remix-utils";

import Button from "./button";
import Dropdown from "./dropdown";

type TableProps<T extends RowData> = { name: string; table: Table<T> };

function HeaderButtons<T extends RowData>({ name, table }: TableProps<T>) {
  const csvData = useMemo(() => {
    const model = table.getCoreRowModel();
    return model.flatRows.map((row) =>
      row.getAllCells().reduce<{ [key: string]: any }>((acc, curr) => {
        acc[curr.column.id] = curr.getValue();
        return acc;
      }, {})
    );
  }, [table]);

  return (
    <div className="flex flex-col justify-end gap-4 sm:flex-row">
      {/* Field Selector */}
      <Dropdown>
        <Dropdown.Button>Fields</Dropdown.Button>
        <Dropdown.Items>
          {table.getAllLeafColumns().map((x) => (
            <Dropdown.Item
              key={x.id}
              className="group flex items-center"
              onClick={x.getToggleVisibilityHandler()}
            >
              {x.getIsVisible() ? (
                <CheckIcon className="-ml-1 mr-3 h-4 w-4" />
              ) : (
                <div className="-ml-1 mr-3 h-4 w-4" />
              )}
              {typeof x.columnDef.header === "string" ? x.columnDef.header : x.id}
            </Dropdown.Item>
          ))}
        </Dropdown.Items>
      </Dropdown>

      {/* Download Button */}
      <ClientOnly fallback={<Button disabled>Download CSV</Button>}>
        {() => (
          <Button as={CSVLink} data={csvData} filename={`${name}.csv`}>
            Download CSV
          </Button>
        )}
      </ClientOnly>
    </div>
  );
}

function Headers<T extends RowData>({ table }: TableProps<T>) {
  return (
    <thead className="bg-gray-50">
      {table.getHeaderGroups().map((group) => (
        <tr key={group.id} className="divide-x divide-gray-200">
          {group.headers.map((x) => (
            <th
              key={x.id}
              colSpan={x.colSpan}
              scope="col"
              onClick={x.column.getToggleSortingHandler()}
            >
              <div className="flex cursor-pointer items-center justify-between whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-gray-900">
                {flexRender(x.column.columnDef.header, x.getContext())}
                {{
                  asc: <ChevronUpIcon className="-mr-1 ml-3 h-4 w-5" />,
                  desc: <ChevronDownIcon className="-mr-1 ml-3 h-4 w-5" />,
                }[x.column.getIsSorted() as string] ?? null}
              </div>
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
}

function Body<T extends RowData>({ table }: TableProps<T>) {
  return (
    <tbody className="divide-y divide-gray-200 bg-white">
      {table.getRowModel().rows.map((row) => (
        <tr key={row.id} className="divide-x divide-gray-200">
          {row.getVisibleCells().map((x) => (
            <td key={x.id}>
              <div className="flex items-center whitespace-nowrap px-4 py-2 text-sm text-gray-500">
                {flexRender(x.column.columnDef.cell, x.getContext())}
              </div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

type DataTableProps<T extends RowData> = {
  name: string;
  data: T[];
  columns: ColumnDef<T, any>[];
  initialState?: Partial<TableState>;
};

export default function DataTable<T extends RowData>({
  name,
  data,
  columns,
  initialState,
}: DataTableProps<T>) {
  const table = useReactTable<T>({
    data,
    columns,
    initialState,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col items-stretch gap-4">
      <HeaderButtons name={name} table={table} />

      <div className="overflow-auto rounded-lg shadow ring-1 ring-black ring-opacity-5">
        <table className="min-w-full divide-y divide-gray-300">
          <Headers name={name} table={table} />
          <Body name={name} table={table} />
        </table>
      </div>
    </div>
  );
}
