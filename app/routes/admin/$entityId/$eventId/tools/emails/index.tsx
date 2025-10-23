/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction, LoaderFunction, SerializeFrom } from "@remix-run/node";
import type {
  EmailBlast,
  Event,
  EventOrganization,
  EventStudent,
  Organization,
} from "~/lib/db.server";

import { EnvelopeIcon, PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { json } from "@remix-run/node";
import { Form, useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useEffect, useState } from "react";
import { validationError } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";

import Markdown from "~/components/markdown";
import { SchemaForm } from "~/components/schema-form";
import { Button, IconButton, Modal } from "~/components/ui";
import { db } from "~/lib/db.server";
import {
  createEmailBlast,
  deleteEmailBlast,
  previewEmailBlast,
  sendEmailBlast,
  sendTestEmail,
  updateEmailBlast,
} from "~/lib/email-blasts.server";
import { getAvailableVariables } from "~/lib/utils/template";

type LoaderData = {
  event: Event;
  emailBlasts: EmailBlast[];
  orgs: (Organization & EventOrganization)[];
  students: EventStudent[];
  hasReplyToAddress: boolean;
};

export const loader: LoaderFunction = async ({ params }) => {
  if (!params.entityId) throw new Response("Entity ID must be provided.", { status: 400 });
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const entitySnap = await db.entity(params.entityId).get();
  const entity = entitySnap.data();
  if (!entity) throw new Response("Entity not found.", { status: 404 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  const emailBlastsSnap = await db
    .eventEmailBlasts(params.eventId)
    .orderBy("createdAt", "desc")
    .get();
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

  return json<LoaderData>({
    event,
    emailBlasts,
    orgs,
    students,
    hasReplyToAddress: !!entity.emailReplyToAddress,
  });
};

const CreateEmailBlastForm = z.object({
  subject: zfd.text(),
  content: zfd.text(),
  recipients: zfd.text(z.enum(["organizations", "students", "both"])),
});

type ActionData =
  | { _form: "CreateEmailBlast"; emailBlast: EmailBlast }
  | { _form: "EditEmailBlast"; emailBlast: EmailBlast }
  | { _form: "DeleteEmailBlast"; success: boolean }
  | { _form: "SendTestEmail"; success: boolean }
  | { _form: "SendEmailBlast"; success: boolean }
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
  if (!params.entityId) throw new Response("Entity ID must be provided.", { status: 400 });
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });

  const formData = await request.formData();

  if (formData.get("_form") === "CreateEmailBlast") {
    const result = await withZod(CreateEmailBlastForm).validate(formData);
    if (result.error) return validationError(result.error);

    const emailBlast = await createEmailBlast(event.id, result.data);

    return json<ActionData>({ _form: "CreateEmailBlast", emailBlast });
  }

  if (formData.get("_form") === "EditEmailBlast") {
    const emailBlastId = formData.get("emailBlastId") as string;
    const result = await withZod(CreateEmailBlastForm).validate(formData);
    if (result.error) return validationError(result.error);

    const emailBlast = await updateEmailBlast(event.id, emailBlastId, result.data);

    return json<ActionData>({ _form: "EditEmailBlast", emailBlast });
  }

  if (formData.get("_form") === "DeleteEmailBlast") {
    const emailBlastId = formData.get("emailBlastId") as string;
    await deleteEmailBlast(event.id, emailBlastId);

    return json<ActionData>({ _form: "DeleteEmailBlast", success: true });
  }

  if (formData.get("_form") === "SendTestEmail") {
    const emailBlastId = formData.get("emailBlastId") as string;
    const testEmail = formData.get("testEmail") as string;
    const recipientType = formData.get("recipientType") as "organization" | "student";
    const recipientId = formData.get("recipientId") as string;

    await sendTestEmail(
      params.entityId,
      event.id,
      emailBlastId,
      testEmail,
      recipientType,
      recipientId
    );

    return json<ActionData>({ _form: "SendTestEmail", success: true });
  }

  if (formData.get("_form") === "SendEmailBlast") {
    const emailBlastId = formData.get("emailBlastId") as string;
    await sendEmailBlast(params.entityId, event.id, emailBlastId);

    return json<ActionData>({ _form: "SendEmailBlast", success: true });
  }

  if (formData.get("_form") === "PreviewEmailBlast") {
    const emailBlastId = formData.get("emailBlastId") as string;
    const recipientType = formData.get("recipientType") as "organization" | "student";
    const recipientId = formData.get("recipientId") as string;

    const preview = await previewEmailBlast(event.id, emailBlastId, recipientType, recipientId);

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
  const actionData = useActionData<ActionData>();

  // Close modal when email blast is successfully created
  useEffect(() => {
    if (actionData?._form === "CreateEmailBlast") {
      setOpen(false);
    }
  }, [actionData, setOpen]);

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      className="flex max-w-4xl flex-col gap-4"
      icon={EnvelopeIcon}
      iconColor="blue"
      title="Create Email Blast"
    >
      <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
        <div>
          <h4 className="mb-2 font-semibold text-gray-700">Organization Variables</h4>
          <p className="flex flex-row flex-wrap items-center gap-2 text-sm text-gray-500">
            {orgVariables.map((x) => (
              <span key={x} className="rounded bg-gray-200 px-1 font-mono">
                {`{{${x}}}`}
              </span>
            ))}
          </p>
        </div>
        <div className="col-span-2">
          <h4 className="mb-2 font-semibold text-gray-700">Student Variables</h4>
          <p className="flex flex-row flex-wrap items-center gap-2 text-sm text-gray-500">
            {studentVariables.map((x) => (
              <span key={x} className="rounded bg-gray-200 px-1 font-mono">
                {`{{${x}}}`}
              </span>
            ))}
          </p>
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
            multiline: true,
            label: "Content (Markdown)",
            rows: 10,
          },
          recipients: {
            label: "Recipients",
          },
        }}
      />
    </Modal>
  );
}

type EditEmailBlastModalProps = {
  emailBlast: SerializeFrom<EmailBlast>;
  open: boolean;
  setOpen: (open: boolean) => void;
};

function EditEmailBlastModal({ emailBlast, open, setOpen }: EditEmailBlastModalProps) {
  const orgVariables = getAvailableVariables("organization");
  const studentVariables = getAvailableVariables("student");
  const actionData = useActionData<ActionData>();

  // Close modal when email blast is successfully updated
  useEffect(() => {
    if (actionData?._form === "EditEmailBlast") {
      setOpen(false);
    }
  }, [actionData]);

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      className="flex max-w-4xl flex-col gap-4"
      icon={PencilIcon}
      iconColor="blue"
      title="Edit Email Blast"
    >
      <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
        <div>
          <h4 className="mb-2 font-semibold text-gray-700">Organization Variables</h4>
          <p className="flex flex-row flex-wrap items-center gap-2 text-sm text-gray-500">
            {orgVariables.map((x) => (
              <span key={x} className="rounded bg-gray-200 px-1 font-mono">
                {`{{${x}}}`}
              </span>
            ))}
          </p>
        </div>
        <div className="col-span-2">
          <h4 className="mb-2 font-semibold text-gray-700">Student Variables</h4>
          <p className="flex flex-row flex-wrap items-center gap-2 text-sm text-gray-500">
            {studentVariables.map((x) => (
              <span key={x} className="rounded bg-gray-200 px-1 font-mono">
                {`{{${x}}}`}
              </span>
            ))}
          </p>
        </div>
      </div>

      <SchemaForm
        id="EditEmailBlast"
        method="post"
        schema={CreateEmailBlastForm}
        buttonLabel="Save Changes"
        defaultValues={{
          subject: emailBlast.subject,
          content: emailBlast.content,
          recipients: emailBlast.recipients,
        }}
        fieldProps={{
          subject: { label: "Subject" },
          content: {
            multiline: true,
            label: "Content (Markdown)",
            rows: 10,
          },
          recipients: {
            label: "Recipients",
          },
        }}
      >
        <input type="hidden" name="emailBlastId" value={emailBlast.id} />
      </SchemaForm>
    </Modal>
  );
}

type DeleteEmailBlastModalProps = {
  emailBlast: SerializeFrom<EmailBlast>;
  open: boolean;
  setOpen: (open: boolean) => void;
};

function DeleteEmailBlastModal({ emailBlast, open, setOpen }: DeleteEmailBlastModalProps) {
  return (
    <Modal
      open={open}
      setOpen={setOpen}
      className="flex max-w-md flex-col gap-4"
      icon={TrashIcon}
      iconColor="red"
      title="Delete Email Blast"
    >
      <p className="text-gray-600">
        Are you sure you want to delete this email blast? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-2">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Form method="post">
          <input type="hidden" name="_form" value="DeleteEmailBlast" />
          <input type="hidden" name="emailBlastId" value={emailBlast.id} />
          <Button type="submit" className="bg-red-600 text-white hover:bg-red-700">
            Delete
          </Button>
        </Form>
      </div>
    </Modal>
  );
}

type PreviewEmailModalProps = {
  emailBlast: SerializeFrom<EmailBlast>;
  open: boolean;
  setOpen: (open: boolean) => void;
};

function PreviewEmailModal({ emailBlast, open, setOpen }: PreviewEmailModalProps) {
  const { orgs, students, hasReplyToAddress } = useLoaderData<LoaderData>();
  const fetcher = useFetcher<ActionData>();
  const testEmailFetcher = useFetcher<ActionData>();
  const [testEmail, setTestEmail] = useState("");

  const annotatedOrgs = orgs.map((o) => ({
    type: "organization" as const,
    id: o.id,
    name: o.name,
    email: o.adminData.email,
  }));

  const annotatedStudents = students.map((s) => ({
    type: "student" as const,
    id: s.id,
    name: `${s.fname} ${s.lname}`,
    email: s.email,
  }));

  const recipients =
    emailBlast.recipients === "organizations"
      ? annotatedOrgs
      : emailBlast.recipients === "students"
      ? annotatedStudents
      : [...annotatedOrgs, ...annotatedStudents];

  const preview = fetcher.data?._form === "PreviewEmailBlast" && fetcher.data.preview;

  // Reset test email when modal closes
  useEffect(() => {
    if (!open) {
      setTestEmail("");
    }
  }, [open]);

  // Show success message
  useEffect(() => {
    if (testEmailFetcher.data?._form === "SendTestEmail" && testEmailFetcher.data.success) {
      alert("Test email sent successfully!");
      setTestEmail("");
    }
  }, [testEmailFetcher.data]);

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      className="flex max-w-6xl flex-col gap-4"
      icon={EnvelopeIcon}
      iconColor="blue"
      title="Preview Email Blast"
    >
      <div className="grid max-h-[min(60vh,48rem)] grid-cols-2 gap-4 text-sm">
        <div className="flex min-h-0 flex-col gap-2">
          <h4 className="font-semibold text-gray-700">Recipients ({recipients.length})</h4>
          <div className="overflow-y-auto rounded-lg border bg-white">
            {recipients.map((r) => {
              const isLoadingThis =
                fetcher.state === "submitting" && fetcher.formData?.get("recipientId") === r.id;
              const isCurrentlyPreviewed =
                preview && preview.recipientId === r.id && preview.recipientType === r.type;

              return (
                <fetcher.Form key={r.id} method="post">
                  <input type="hidden" name="_form" value="PreviewEmailBlast" />
                  <input type="hidden" name="emailBlastId" value={emailBlast.id} />
                  <input type="hidden" name="recipientType" value={r.type} />
                  <input type="hidden" name="recipientId" value={r.id} />
                  <button
                    type="submit"
                    disabled={fetcher.state === "submitting"}
                    className={`flex w-full items-center justify-between border-b py-2 text-left hover:bg-gray-50 disabled:opacity-50 ${
                      isCurrentlyPreviewed
                        ? "border-l-4 border-l-blue-600 bg-blue-50 pl-[calc(1rem-4px)] pr-4"
                        : "px-4"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-gray-500">{r.email}</div>
                    </div>
                    {isLoadingThis ? (
                      <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                    ) : (
                      isCurrentlyPreviewed && (
                        <div className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                          ✓
                        </div>
                      )
                    )}
                  </button>
                </fetcher.Form>
              );
            })}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-2">
          <h4 className="font-semibold text-gray-700">Preview</h4>
          {preview ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="rounded-lg border bg-white p-4">
                <h5 className="mb-2 font-medium text-gray-700">Send Test Email</h5>
                {!hasReplyToAddress ? (
                  <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                    <p className="font-medium">Reply-to address required</p>
                    <p className="mt-1">
                      You must configure an email reply-to address for this entity before sending
                      emails.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mb-2 text-sm text-gray-500">
                      Send a test email with this preview to any email address
                    </p>
                    <testEmailFetcher.Form method="post" className="flex gap-2">
                      <input type="hidden" name="_form" value="SendTestEmail" />
                      <input type="hidden" name="emailBlastId" value={emailBlast.id} />
                      <input type="hidden" name="recipientType" value={preview.recipientType} />
                      <input type="hidden" name="recipientId" value={preview.recipientId} />
                      <input
                        type="email"
                        name="testEmail"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                      <Button
                        type="submit"
                        disabled={!testEmail || testEmailFetcher.state === "submitting"}
                        className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {testEmailFetcher.state === "submitting" ? "Sending..." : "Send Test"}
                      </Button>
                    </testEmailFetcher.Form>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-4 overflow-y-auto rounded-lg border bg-white p-4">
                <div className="flex flex-col gap-2 border-b pb-4">
                  <p>
                    <span className="font-medium text-gray-500">To:</span>{" "}
                    <span>{preview.recipientEmail}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">Subject:</span>{" "}
                    <span>{preview.subject}</span>
                  </p>
                </div>
                <div className="prose prose-sm max-w-none">
                  <Markdown>{preview.content}</Markdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border bg-gray-50 text-gray-500">
              Select a recipient to preview the email
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" onClick={() => setOpen(false)}>
          Close
        </Button>
        <Form method="post">
          <input type="hidden" name="_form" value="SendEmailBlast" />
          <input type="hidden" name="emailBlastId" value={emailBlast.id} />
          <Button
            type="submit"
            disabled={!hasReplyToAddress}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={
              !hasReplyToAddress ? "Email reply-to address must be configured before sending" : ""
            }
          >
            Send Email Blast
          </Button>
        </Form>
      </div>
    </Modal>
  );
}

export default function EmailsRoute() {
  const { emailBlasts } = useLoaderData<LoaderData>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editEmailBlast, setEditEmailBlast] = useState<SerializeFrom<EmailBlast> | null>(null);
  const [previewEmailBlast, setPreviewEmailBlast] = useState<SerializeFrom<EmailBlast> | null>(
    null
  );
  const [deleteEmailBlast, setDeleteEmailBlast] = useState<SerializeFrom<EmailBlast> | null>(null);

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
          <div className="flex flex-col divide-y">
            {emailBlasts.map((blast) => (
              <div key={blast.id} className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <h3 className="font-medium">{blast.subject}</h3>
                  <div className="mt-1 flex items-center gap-4 text-gray-500">
                    <span>Recipients: {blast.recipients}</span>
                    <span>Status: {blast.status}</span>
                    {blast.totalRecipients && (
                      <span>
                        Sent: {blast.sentCount}/{blast.totalRecipients}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  {blast.status === "draft" && (
                    <>
                      <IconButton className="self-center" onClick={() => setEditEmailBlast(blast)}>
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        className="self-center"
                        onClick={() => setDeleteEmailBlast(blast)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                      <Button onClick={() => setPreviewEmailBlast(blast)}>
                        Preview &amp; Send
                      </Button>

                      <EditEmailBlastModal
                        emailBlast={blast}
                        open={blast.id === editEmailBlast?.id}
                        setOpen={(open) => !open && setEditEmailBlast(null)}
                      />
                      <PreviewEmailModal
                        emailBlast={blast}
                        open={blast.id === previewEmailBlast?.id}
                        setOpen={(open) => !open && setPreviewEmailBlast(null)}
                      />
                      <DeleteEmailBlastModal
                        emailBlast={blast}
                        open={blast.id === deleteEmailBlast?.id}
                        setOpen={(open) => !open && setDeleteEmailBlast(null)}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateEmailBlastModal open={createOpen} setOpen={setCreateOpen} />
    </div>
  );
}

export const handle = {
  navigationHeading: "Emails",
};
