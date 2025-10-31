/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction, LoaderFunction, SerializeFrom } from "@remix-run/node";
import type {
  DocumentTemplate,
  Event,
  EventOrganization,
  EventStudent,
  EventTeam,
  Organization,
} from "~/lib/db.server";

import {
  DocumentTextIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { json } from "@remix-run/node";
import { Form, useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useEffect, useRef, useState } from "react";
import { validationError } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { $typst } from "@myriaddreamin/typst.ts";
import * as pdfjsLib from "pdfjs-dist";

import { SchemaForm } from "~/components/schema-form";
import { Button, IconButton, Modal } from "~/components/ui";
import { db } from "~/lib/db.server";
import { FieldValue } from "firebase-admin/firestore";

type LoaderData = {
  event: Event;
  documentTemplates: DocumentTemplate[];
  orgs: (Organization & EventOrganization)[];
  students: EventStudent[];
  teams: EventTeam[];
};

export const loader: LoaderFunction = async ({ params }) => {
  if (!params.entityId) throw new Response("Entity ID must be provided.", { status: 400 });
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  const documentTemplatesSnap = await db
    .eventDocumentTemplates(params.eventId)
    .orderBy("createdAt", "desc")
    .get();
  const documentTemplates = documentTemplatesSnap.docs.map((x) => x.data());

  const eventOrgsSnap = await db.eventOrgs(params.eventId).get();
  const eventOrgs = new Map(eventOrgsSnap.docs.map((x) => [x.id, x.data()]));

  const orgsSnap = await db.orgs.get();
  const orgs = orgsSnap.docs.flatMap((x) => {
    const eventOrg = eventOrgs.get(x.id);
    if (!eventOrg) return [];
    return { ...eventOrg, ...x.data() };
  });

  const studentsSnap = await db.eventStudents(params.eventId).get();
  const students = studentsSnap.docs.map((x) => x.data());

  const teamsSnap = await db.eventTeams(params.eventId).get();
  const teams = teamsSnap.docs.map((x) => x.data());

  return json<LoaderData>({
    event,
    documentTemplates,
    orgs,
    students,
    teams,
  });
};

const CreateDocumentTemplateForm = z.object({
  name: zfd.text(),
  typstSource: zfd.text(),
  dataSource: zfd.text(z.enum(["student", "organization", "team"])),
});

type ActionData =
  | { _form: "CreateDocumentTemplate"; documentTemplate: DocumentTemplate }
  | { _form: "EditDocumentTemplate"; documentTemplate: DocumentTemplate }
  | { _form: "DeleteDocumentTemplate"; success: boolean };

export const action: ActionFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });

  const formData = await request.formData();

  if (formData.get("_form") === "CreateDocumentTemplate") {
    const result = await withZod(CreateDocumentTemplateForm).validate(formData);
    if (result.error) return validationError(result.error);

    const docRef = db.eventDocumentTemplates(params.eventId).doc();
    const now = FieldValue.serverTimestamp();

    await docRef.set({
      id: docRef.id,
      name: result.data.name,
      typstSource: result.data.typstSource,
      dataSource: result.data.dataSource,
      createdAt: now,
      updatedAt: now,
    });

    const documentTemplate = (await docRef.get()).data();
    if (!documentTemplate)
      throw new Response("Failed to create document template.", { status: 500 });

    return json<ActionData>({ _form: "CreateDocumentTemplate", documentTemplate });
  }

  if (formData.get("_form") === "EditDocumentTemplate") {
    const documentTemplateId = formData.get("documentTemplateId") as string;
    const result = await withZod(CreateDocumentTemplateForm).validate(formData);
    if (result.error) return validationError(result.error);

    const docRef = db.eventDocumentTemplate(params.eventId, documentTemplateId);
    await docRef.update({
      name: result.data.name,
      typstSource: result.data.typstSource,
      dataSource: result.data.dataSource,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const documentTemplate = (await docRef.get()).data();
    if (!documentTemplate) throw new Response("Document template not found.", { status: 404 });

    return json<ActionData>({ _form: "EditDocumentTemplate", documentTemplate });
  }

  if (formData.get("_form") === "DeleteDocumentTemplate") {
    const documentTemplateId = formData.get("documentTemplateId") as string;
    await db.eventDocumentTemplate(params.eventId, documentTemplateId).delete();

    return json<ActionData>({ _form: "DeleteDocumentTemplate", success: true });
  }
};

type CreateDocumentTemplateModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

function CreateDocumentTemplateModal({ open, setOpen }: CreateDocumentTemplateModalProps) {
  const actionData = useActionData<ActionData>();

  useEffect(() => {
    if (actionData?._form === "CreateDocumentTemplate") {
      setOpen(false);
    }
  }, [actionData, setOpen]);

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      className="flex max-w-4xl flex-col gap-4"
      icon={DocumentTextIcon}
      iconColor="blue"
      title="Create Document Template"
    >
      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="mb-2 font-semibold text-gray-700">Typst Variables</h4>
        <p className="text-sm text-gray-600">
          Use <code className="rounded bg-gray-200 px-1 font-mono">sys.inputs</code> to access data
          from the selected data source. The available fields depend on the data source you choose.
        </p>
      </div>

      <SchemaForm
        id="CreateDocumentTemplate"
        method="post"
        schema={CreateDocumentTemplateForm}
        buttonLabel="Create Template"
        fieldProps={{
          name: { label: "Template Name" },
          typstSource: {
            multiline: true,
            label: "Typst Source Code",
            rows: 15,
          },
          dataSource: {
            label: "Data Source",
          },
        }}
      />
    </Modal>
  );
}

type EditDocumentTemplateModalProps = {
  documentTemplate: SerializeFrom<DocumentTemplate>;
  open: boolean;
  setOpen: (open: boolean) => void;
};

function EditDocumentTemplateModal({
  documentTemplate,
  open,
  setOpen,
}: EditDocumentTemplateModalProps) {
  const actionData = useActionData<ActionData>();

  useEffect(() => {
    if (actionData?._form === "EditDocumentTemplate") {
      setOpen(false);
    }
  }, [actionData, setOpen]);

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      className="flex max-w-4xl flex-col gap-4"
      icon={PencilIcon}
      iconColor="blue"
      title="Edit Document Template"
    >
      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="mb-2 font-semibold text-gray-700">Typst Variables</h4>
        <p className="text-sm text-gray-600">
          Use <code className="rounded bg-gray-200 px-1 font-mono">sys.inputs</code> to access data
          from the selected data source. The available fields depend on the data source you choose.
        </p>
      </div>

      <SchemaForm
        id="EditDocumentTemplate"
        method="post"
        schema={CreateDocumentTemplateForm}
        buttonLabel="Save Changes"
        defaultValues={{
          name: documentTemplate.name,
          typstSource: documentTemplate.typstSource,
          dataSource: documentTemplate.dataSource,
        }}
        fieldProps={{
          name: { label: "Template Name" },
          typstSource: {
            multiline: true,
            label: "Typst Source Code",
            rows: 15,
          },
          dataSource: {
            label: "Data Source",
          },
        }}
      >
        <input type="hidden" name="documentTemplateId" value={documentTemplate.id} />
      </SchemaForm>
    </Modal>
  );
}

type DeleteDocumentTemplateModalProps = {
  documentTemplate: SerializeFrom<DocumentTemplate>;
  open: boolean;
  setOpen: (open: boolean) => void;
};

function DeleteDocumentTemplateModal({
  documentTemplate,
  open,
  setOpen,
}: DeleteDocumentTemplateModalProps) {
  return (
    <Modal
      open={open}
      setOpen={setOpen}
      className="flex max-w-md flex-col gap-4"
      icon={TrashIcon}
      iconColor="red"
      title="Delete Document Template"
    >
      <p className="text-gray-600">
        Are you sure you want to delete this document template? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-2">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Form method="post">
          <input type="hidden" name="_form" value="DeleteDocumentTemplate" />
          <input type="hidden" name="documentTemplateId" value={documentTemplate.id} />
          <Button type="submit" className="bg-red-600 text-white hover:bg-red-700">
            Delete
          </Button>
        </Form>
      </div>
    </Modal>
  );
}

type PreviewDocumentModalProps = {
  documentTemplate: SerializeFrom<DocumentTemplate>;
  open: boolean;
  setOpen: (open: boolean) => void;
};

function PreviewDocumentModal({ documentTemplate, open, setOpen }: PreviewDocumentModalProps) {
  const { orgs, students, teams } = useLoaderData<LoaderData>();
  const [selectedId, setSelectedId] = useState<string>("");
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);

  const dataItems =
    documentTemplate.dataSource === "organization"
      ? orgs.map((o) => ({ id: o.id, name: o.name }))
      : documentTemplate.dataSource === "student"
      ? students.map((s) => ({ id: s.id, name: `${s.fname} ${s.lname}` }))
      : teams.map((t) => ({ id: t.id, name: t.name }));

  useEffect(() => {
    if (!open) {
      setSelectedId("");
      setPdfData(null);
      setRenderError(null);
    }
  }, [open]);

  const renderDocument = async () => {
    if (!selectedId) return;

    setIsRendering(true);
    setRenderError(null);

    try {
      const selectedItem =
        documentTemplate.dataSource === "organization"
          ? orgs.find((o) => o.id === selectedId)
          : documentTemplate.dataSource === "student"
          ? students.find((s) => s.id === selectedId)
          : teams.find((t) => t.id === selectedId);

      if (!selectedItem) {
        throw new Error("Selected item not found");
      }

      const inputs: Record<string, string> = {};
      Object.keys(selectedItem).forEach((key) => {
        const value = (selectedItem as any)[key];
        if (typeof value === "string" || typeof value === "number") {
          inputs[key] = String(value);
        }
      });

      const pdf = await $typst.pdf({
        mainContent: documentTemplate.typstSource,
        inputs,
      });

      setPdfData(pdf);

      if (canvasRef.current) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const loadingTask = pdfjsLib.getDocument({ data: pdf });
        const pdfDoc = await loadingTask.promise;
        const page = await pdfDoc.getPage(1);

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      }
    } catch (error) {
      console.error("Error rendering document:", error);
      setRenderError(error instanceof Error ? error.message : "Failed to render document");
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      renderDocument();
    }
  }, [selectedId]);

  const handlePrint = () => {
    if (!pdfData) return;

    const blob = new Blob([pdfData], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 100);
    };
  };

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      className="flex max-w-6xl flex-col gap-4"
      icon={DocumentTextIcon}
      iconColor="blue"
      title="Preview Document"
    >
      <div className="grid max-h-[min(70vh,56rem)] grid-cols-2 gap-4 text-sm">
        <div className="flex min-h-0 flex-col gap-2">
          <h4 className="font-semibold text-gray-700">
            Select {documentTemplate.dataSource} ({dataItems.length})
          </h4>
          <div className="overflow-y-auto rounded-lg border bg-white">
            {dataItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`flex w-full items-center justify-between border-b px-4 py-2 text-left hover:bg-gray-50 ${
                  selectedId === item.id
                    ? "border-l-4 border-l-blue-600 bg-blue-50 pl-[calc(1rem-4px)]"
                    : ""
                }`}
              >
                <div className="font-medium">{item.name}</div>
                {selectedId === item.id && (
                  <div className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-700">Preview</h4>
            {pdfData && (
              <Button onClick={handlePrint} className="flex items-center gap-2">
                <PrinterIcon className="h-4 w-4" />
                Print
              </Button>
            )}
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg border bg-gray-50">
            {!selectedId ? (
              <p className="text-gray-500">Select an item to preview</p>
            ) : isRendering ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
                <p className="text-gray-500">Rendering document...</p>
              </div>
            ) : renderError ? (
              <div className="rounded-lg bg-red-50 p-4 text-red-800">
                <p className="font-medium">Error rendering document</p>
                <p className="text-sm">{renderError}</p>
              </div>
            ) : (
              <canvas ref={canvasRef} className="max-w-full" />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function DocumentsRoute() {
  const { documentTemplates } = useLoaderData<LoaderData>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SerializeFrom<DocumentTemplate> | null>(
    null
  );
  const [deletingTemplate, setDeletingTemplate] = useState<SerializeFrom<DocumentTemplate> | null>(
    null
  );
  const [previewingTemplate, setPreviewingTemplate] =
    useState<SerializeFrom<DocumentTemplate> | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Document Templates</h2>
        <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Create Template
        </Button>
      </div>

      {documentTemplates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No document templates</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new document template.
          </p>
          <div className="mt-6">
            <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Create Template
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Data Source
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {documentTemplates.map((template) => (
                <tr key={template.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {template.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {template.dataSource}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <IconButton onClick={() => setPreviewingTemplate(template)} title="Preview">
                        <DocumentTextIcon className="h-5 w-5" />
                      </IconButton>
                      <IconButton onClick={() => setEditingTemplate(template)} title="Edit">
                        <PencilIcon className="h-5 w-5" />
                      </IconButton>
                      <IconButton onClick={() => setDeletingTemplate(template)} title="Delete">
                        <TrashIcon className="h-5 w-5" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateDocumentTemplateModal open={createModalOpen} setOpen={setCreateModalOpen} />
      {editingTemplate && (
        <EditDocumentTemplateModal
          documentTemplate={editingTemplate}
          open={!!editingTemplate}
          setOpen={(open) => !open && setEditingTemplate(null)}
        />
      )}
      {deletingTemplate && (
        <DeleteDocumentTemplateModal
          documentTemplate={deletingTemplate}
          open={!!deletingTemplate}
          setOpen={(open) => !open && setDeletingTemplate(null)}
        />
      )}
      {previewingTemplate && (
        <PreviewDocumentModal
          documentTemplate={previewingTemplate}
          open={!!previewingTemplate}
          setOpen={(open) => !open && setPreviewingTemplate(null)}
        />
      )}
    </div>
  );
}

export const handle = {
  navigationHeading: "Document Templates",
};
