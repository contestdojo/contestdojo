/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Table } from "@tanstack/react-table";

import { flexRender } from "@tanstack/react-table";

type DataTableProps<T> = {
  table: Table<T>;
};

export default function DataTable<T>({ table }: DataTableProps<T>) {
  return (
    <div className="h-full overflow-auto rounded-lg shadow ring-1 ring-black ring-opacity-5">
      <table className="min-w-full border-separate border-spacing-0 divide-y divide-gray-300	">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="sticky top-0 whitespace-nowrap border-b border-gray-300 bg-gray-50 bg-opacity-75 px-2 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter first:pl-4 last:pr-4"
                  scope="col"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody className="divide-y divide-gray-200 bg-white">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="group">
              {row.getVisibleCells().map((cell) => (
                <td
                  className="whitespace-nowrap border-b border-gray-200 px-2 py-2 text-sm text-gray-500 first:pl-4 last:pr-4 group-last:border-none"
                  key={cell.id}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        {/* <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.footer, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </tfoot> */}
      </table>
    </div>
  );
}
