/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type {
  EmailBlast,
  Event,
  EventOrganization,
  EventStudent,
  Organization,
} from "~/lib/db.server";

import { Dialog } from "@headlessui/react";
import { EnvelopeIcon, PlusIcon } from "@heroicons/react/24/outline";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { FieldValue } from "firebase-admin/firestore";
import { useState } from "react";
import { validationError } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";

import Markdown from "~/components/markdown";
import { SchemaForm } from "~/components/schema-form";
import { Button, Modal } from "~/components/ui";
import { db } from "~/lib/db.server";
import { resend } from "~/lib/resend.server";
import { getAvailableVariables, renderMarkdownToHtml, renderTemplate } from "~/lib/utils/template";

type LoaderData = {
  event: Event;
  emailBlasts: EmailBlast[];
  orgs: (Organization & EventOrganization)[];
  students: EventStudent[];
};

export const loader: LoaderFunction = async ({ params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  const emailBlastsSnap = await db.eventEmailBlasts(params.eventId).get();
  const emailBlasts = emailBlastsSnap.docs.map((x) => x.data());

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

  return json<LoaderData>({ event, emailBlasts, orgs, students });
};

const CreateEmailBlastForm = z.object({
  subject: zfd.text(),
  content: zfd.text(),
  recipients: zfd.text(z.enum(["organizations", "students", "both"])),
});

type ActionData =
  | {
      _form: "CreateEmailBlast";
      emailBlast: EmailBlast;
    }
  | {
      _form: "SendEmailBlast";
      success: boolean;
    }
  | {
      _form: "PreviewEmailBlast";
      preview: {
        recipientType: "organization" | "student";
        recipientId: string;
        recipientName: string;
        recipientEmail: string;
        subject: string;
        content: string;
      };
    };

export const action: ActionFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });

  const formData = await request.formData();

  if (formData.get("_form") === "CreateEmailBlast") {
    const result = await withZod(CreateEmailBlastForm).validate(formData);
    if (result.error) return validationError(result.error);

    const emailBlastRef = db.eventEmailBlasts(event.id).doc();
    const emailBlast: EmailBlast = {
      id: emailBlastRef.id,
      subject: result.data.subject,
      content: result.data.content,
      recipients: result.data.recipients,
      createdAt: FieldValue.serverTimestamp() as any,
      status: "draft",
    };

    await emailBlastRef.set(emailBlast);

    return json<ActionData>({ _form: "CreateEmailBlast", emailBlast });
  }

  if (formData.get("_form") === "SendEmailBlast") {
    const emailBlastId = formData.get("emailBlastId") as string;
    const emailBlastSnap = await db.eventEmailBlast(event.id, emailBlastId).get();
    const emailBlast = emailBlastSnap.data();

    if (!emailBlast) throw new Response("Email blast not found.", { status: 404 });

    await db.eventEmailBlast(event.id, emailBlastId).update({
      status: "sending",
    });

    const eventOrgsSnap = await db.eventOrgs(event.id).get();
    const eventOrgs = new Map(eventOrgsSnap.docs.map((x) => [x.id, x.data()]));

    const orgsSnap = await db.orgs.get();
    const orgs = orgsSnap.docs.flatMap((x) => {
      const eventOrg = eventOrgs.get(x.id);
      if (!eventOrg) return [];
      return { ...eventOrg, ...x.data() };
    });

    const studentsSnap = await db.eventStudents(event.id).get();
    const students = studentsSnap.docs.map((x) => x.data());

    const recipients: Array<{ email: string; variables: Record<string, string> }> = [];

    if (emailBlast.recipients === "organizations" || emailBlast.recipients === "both") {
      for (const org of orgs) {
        recipients.push({
          email: org.adminData.email,
          variables: {
            "org.name": org.name,
            "org.address": org.address,
            "org.city": org.city,
            "org.state": org.state,
            "org.country": org.country,
            "org.zip": org.zip,
            "coach.fname": org.adminData.fname,
            "coach.lname": org.adminData.lname,
            "coach.email": org.adminData.email,
          },
        });
      }
    }

    if (emailBlast.recipients === "students" || emailBlast.recipients === "both") {
      for (const student of students) {
        const org = student.org ? orgs.find((o) => o.id === student.org?.id) : undefined;
        recipients.push({
          email: student.email,
          variables: {
            "student.fname": student.fname,
            "student.lname": student.lname,
            "student.email": student.email,
            "student.grade": student.grade?.toString() ?? "",
            "student.number": student.number ?? "",
            "org.name": org?.name ?? "",
          },
        });
      }
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        const subject = renderTemplate(emailBlast.subject, recipient.variables);
        const markdownContent = renderTemplate(emailBlast.content, recipient.variables);
        const htmlContent = await renderMarkdownToHtml(markdownContent);

        await resend.emails.send({
          from: "ContestDojo <noreply@contestdojo.com>",
          to: recipient.email,
          subject,
          html: htmlContent,
        });

        sentCount++;
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        failedCount++;
      }
    }

    await db.eventEmailBlast(event.id, emailBlastId).update({
      status: failedCount > 0 ? "failed" : "sent",
      sentAt: FieldValue.serverTimestamp(),
      totalRecipients: recipients.length,
      sentCount,
      failedCount,
    });

    return json<ActionData>({ _form: "SendEmailBlast", success: true });
  }

  if (formData.get("_form") === "PreviewEmailBlast") {
    const emailBlastId = formData.get("emailBlastId") as string;
    const recipientType = formData.get("recipientType") as "organization" | "student";
    const recipientId = formData.get("recipientId") as string;

    const emailBlastSnap = await db.eventEmailBlast(event.id, emailBlastId).get();
    const emailBlast = emailBlastSnap.data();

    if (!emailBlast) throw new Response("Email blast not found.", { status: 404 });

    let preview: ActionData["_form"] extends "PreviewEmailBlast" ? ActionData["preview"] : never;

    if (recipientType === "organization") {
      const orgSnap = await db.org(recipientId).get();
      const org = orgSnap.data();
      if (!org) throw new Response("Organization not found.", { status: 404 });

      const variables = {
        "org.name": org.name,
        "org.address": org.address,
        "org.city": org.city,
        "org.state": org.state,
        "org.country": org.country,
        "org.zip": org.zip,
        "coach.fname": org.adminData.fname,
        "coach.lname": org.adminData.lname,
        "coach.email": org.adminData.email,
      };

      preview = {
        recipientType,
        recipientId,
        recipientName: org.name,
        recipientEmail: org.adminData.email,
        subject: renderTemplate(emailBlast.subject, variables),
        content: renderTemplate(emailBlast.content, variables),
      };
    } else {
      const studentSnap = await db.eventStudent(event.id, recipientId).get();
      const student = studentSnap.data();
      if (!student) throw new Response("Student not found.", { status: 404 });

      const org = student.org ? (await db.org(student.org.id).get()).data() : undefined;

      const variables = {
        "student.fname": student.fname,
        "student.lname": student.lname,
        "student.email": student.email,
        "student.grade": student.grade?.toString() ?? "",
        "student.number": student.number ?? "",
        "org.name": org?.name ?? "",
      };

      preview = {
        recipientType,
        recipientId,
        recipientName: `${student.fname} ${student.lname}`,
        recipientEmail: student.email,
        subject: renderTemplate(emailBlast.subject, variables),
        content: renderTemplate(emailBlast.content, variables),
      };
    }

    return json<ActionData>({ _form: "PreviewEmailBlast", preview });
  }
};

type CreateEmailBlastModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

function CreateEmailBlastModal({ open, setOpen }: CreateEmailBlastModalProps) {
  const orgVariables = getAvailableVariables("organization");
  const studentVariables = getAvailableVariables("student");

  return (
    <Modal open={open} setOpen={setOpen} className="flex max-w-4xl flex-col gap-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <EnvelopeIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
      </div>

      <Dialog.Title as="h3" className="text-center text-lg font-medium text-gray-900">
        Create Email Blast
      </Dialog.Title>

      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="mb-2 text-sm font-semibold text-gray-700">Available Variables</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-600">For Organizations:</p>
            <div className="flex flex-wrap gap-1">
              {orgVariables.map((v) => (
                <code key={v} className="rounded bg-white px-2 py-1 text-xs">
                  {`{{${v}}}`}
                </code>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-600">For Students:</p>
            <div className="flex flex-wrap gap-1">
              {studentVariables.map((v) => (
                <code key={v} className="rounded bg-white px-2 py-1 text-xs">
                  {`{{${v}}}`}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SchemaForm
        id="CreateEmailBlast"
        method="post"
        schema={CreateEmailBlastForm}
        buttonLabel="Create Draft"
        fieldProps={{
          subject: { label: "Subject" },
          content: {
            label: "Content (Markdown)",
            as: "textarea",
            rows: 10,
          },
          recipients: {
            label: "Recipients",
            as: "select",
          },
        }}
      />
    </Modal>
  );
}

type PreviewEmailModalProps = {
  emailBlast: EmailBlast;
  open: boolean;
  setOpen: (open: boolean) => void;
};

function PreviewEmailModal({ emailBlast, open, setOpen }: PreviewEmailModalProps) {
  const { orgs, students } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();

  const recipients =
    emailBlast.recipients === "organizations"
      ? orgs.map((o) => ({
          type: "organization" as const,
          id: o.id,
          name: o.name,
          email: o.adminData.email,
        }))
      : emailBlast.recipients === "students"
      ? students.map((s) => ({
          type: "student" as const,
          id: s.id,
          name: `${s.fname} ${s.lname}`,
          email: s.email,
        }))
      : [
          ...orgs.map((o) => ({
            type: "organization" as const,
            id: o.id,
            name: o.name,
            email: o.adminData.email,
          })),
          ...students.map((s) => ({
            type: "student" as const,
            id: s.id,
            name: `${s.fname} ${s.lname}`,
            email: s.email,
          })),
        ];

  const preview = actionData?._form === "PreviewEmailBlast" ? actionData.preview : null;

  return (
    <Modal open={open} setOpen={setOpen} className="flex max-w-6xl flex-col gap-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <EnvelopeIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
      </div>

      <Dialog.Title as="h3" className="text-center text-lg font-medium text-gray-900">
        Preview Email Blast
      </Dialog.Title>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-700">
            Recipients ({recipients.length})
          </h4>
          <div className="max-h-96 overflow-y-auto rounded-lg border bg-white">
            {recipients.map((r) => (
              <form key={`${r.type}-${r.id}`} method="post">
                <input type="hidden" name="_form" value="PreviewEmailBlast" />
                <input type="hidden" name="emailBlastId" value={emailBlast.id} />
                <input type="hidden" name="recipientType" value={r.type} />
                <input type="hidden" name="recipientId" value={r.id} />
                <button
                  type="submit"
                  className="w-full border-b px-4 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.email}</div>
                </button>
              </form>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-700">Preview</h4>
          {preview ? (
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-4 border-b pb-4">
                <div className="mb-2">
                  <span className="text-xs font-medium text-gray-500">To:</span>{" "}
                  <span className="text-sm">{preview.recipientEmail}</span>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Subject:</span>{" "}
                  <span className="text-sm font-medium">{preview.subject}</span>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <Markdown>{preview.content}</Markdown>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border bg-gray-50 text-sm text-gray-500">
              Select a recipient to preview the email
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" onClick={() => setOpen(false)}>
          Close
        </Button>
        <form method="post">
          <input type="hidden" name="_form" value="SendEmailBlast" />
          <input type="hidden" name="emailBlastId" value={emailBlast.id} />
          <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
            Send Email Blast
          </Button>
        </form>
      </div>
    </Modal>
  );
}

export default function EmailingRoute() {
  const { emailBlasts } = useLoaderData<LoaderData>();
  const [createOpen, setCreateOpen] = useState(false);
  const [previewEmailBlast, setPreviewEmailBlast] = useState<EmailBlast | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Email Blasts</h2>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="mr-2 h-5 w-5" />
          Create Email Blast
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        {emailBlasts.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-gray-500">
            No email blasts yet. Create one to get started.
          </div>
        ) : (
          <div className="divide-y">
            {emailBlasts.map((blast) => (
              <div key={blast.id} className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <h3 className="font-medium">{blast.subject}</h3>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    <span>Recipients: {blast.recipients}</span>
                    <span>Status: {blast.status}</span>
                    {blast.totalRecipients && (
                      <span>
                        Sent: {blast.sentCount}/{blast.totalRecipients}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {blast.status === "draft" && (
                    <Button onClick={() => setPreviewEmailBlast(blast)}>Preview & Send</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateEmailBlastModal open={createOpen} setOpen={setCreateOpen} />
      {previewEmailBlast && (
        <PreviewEmailModal
          emailBlast={previewEmailBlast}
          open={!!previewEmailBlast}
          setOpen={(open) => !open && setPreviewEmailBlast(null)}
        />
      )}
    </div>
  );
}

export const handle = {
  navigationHeading: "Emailing",
};
