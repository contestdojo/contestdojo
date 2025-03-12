/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ColumnDef, RowData, TableState, Table as TanstackTable } from "@tanstack/react-table";
import type { PropsWithChildren } from "react";

import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { CSVLink } from "react-csv";
import { ClientOnly } from "remix-utils/client-only";

import { Button, Dropdown, Table, Tbody, Td, Th, Thead, Tfoot, Tr } from "~/components/ui";

type TableProps<T extends RowData> = PropsWithChildren<{
  filename: string;
  table: TanstackTable<T>;
}>;

function HeaderButtons<T extends RowData>({ filename, table, children }: TableProps<T>) {
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
      {children}

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
          <Button as={CSVLink} data={csvData} filename={filename}>
            Download CSV
          </Button>
        )}
      </ClientOnly>
    </div>
  );
}

function Headers<T extends RowData>({ table }: TableProps<T>) {
  return (
    <Thead>
      {table.getHeaderGroups().map((group) => (
        <Tr key={group.id}>
          {group.headers.map((x) => (
            <Th
              key={x.id}
              colSpan={x.colSpan}
              scope="col"
              onClick={x.column.getToggleSortingHandler()}
              className="cursor-pointer"
            >
              <div className="items-between flex">
                {flexRender(x.column.columnDef.header, x.getContext())}
                {{
                  asc: <ChevronUpIcon className="-mr-1 ml-3 h-4 w-5" />,
                  desc: <ChevronDownIcon className="-mr-1 ml-3 h-4 w-5" />,
                }[x.column.getIsSorted() as string] ?? null}
              </div>
            </Th>
          ))}
        </Tr>
      ))}
    </Thead>
  );
}

function Body<T extends RowData>({ table }: TableProps<T>) {
  return (
    <Tbody>
      {table.getRowModel().rows.map((row) => (
        <Tr key={row.id}>
          {row.getVisibleCells().map((x) => (
            <Td key={x.id}>
              <div className="flex">{flexRender(x.column.columnDef.cell, x.getContext())}</div>
            </Td>
          ))}
        </Tr>
      ))}
    </Tbody>
  );
}

function Footers<T extends RowData>({ table }: TableProps<T>) {
  return (
    <Tfoot>
      {table.getFooterGroups().map((group) => (
        <Tr key={group.id}>
          {group.headers.map((x) => (
            <Th key={x.id} colSpan={x.colSpan} scope="col">
              <div className="flex">{flexRender(x.column.columnDef.footer, x.getContext())}</div>
            </Th>
          ))}
        </Tr>
      ))}
    </Tfoot>
  );
}

type DataTableProps<T extends RowData> = PropsWithChildren<{
  filename: string;
  data: T[];
  columns: ColumnDef<T, any>[];
  initialState?: Partial<TableState>;
}>;

export function DataTable<T extends RowData>({
  filename,
  data,
  columns,
  initialState,
  children,
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
      <HeaderButtons filename={filename} table={table} children={children} />

      <div className="overflow-auto rounded-lg shadow ring-1 ring-black ring-opacity-5">
        <Table>
          <Headers filename={filename} table={table} />
          <Body filename={filename} table={table} />
          <Footers filename={filename} table={table} />
        </Table>
      </div>
    </div>
  );
}
