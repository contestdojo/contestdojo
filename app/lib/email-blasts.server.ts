/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { EmailBlast, EventOrganization, EventStudent, Organization } from "~/lib/db.server";

import { FieldValue } from "firebase-admin/firestore";

import { db } from "~/lib/db.server";
import { resend } from "~/lib/resend.server";
import { renderMarkdownToHtml, renderTemplate } from "~/lib/utils/template";

type EmailRecipient = {
  email: string;
  variables: Record<string, string | undefined>;
};

type OrganizationWithEvent = Organization & EventOrganization;

export async function createEmailBlast(
  eventId: string,
  data: { subject: string; content: string; recipients: "organizations" | "students" | "both" }
) {
  const emailBlastRef = db.eventEmailBlasts(eventId).doc();
  const emailBlast: EmailBlast = {
    id: emailBlastRef.id,
    subject: data.subject,
    content: data.content,
    recipients: data.recipients,
    createdAt: FieldValue.serverTimestamp() as any,
    status: "draft",
  };

  await emailBlastRef.set(emailBlast);

  return emailBlast;
}

export async function updateEmailBlast(
  eventId: string,
  emailBlastId: string,
  data: { subject: string; content: string; recipients: "organizations" | "students" | "both" }
) {
  const emailBlastSnap = await db.eventEmailBlast(eventId, emailBlastId).get();
  const emailBlast = emailBlastSnap.data();

  if (!emailBlast) throw new Response("Email blast not found.", { status: 404 });
  if (emailBlast.status !== "draft") {
    throw new Response("Can only edit draft email blasts.", { status: 400 });
  }

  await db.eventEmailBlast(eventId, emailBlastId).update({
    subject: data.subject,
    content: data.content,
    recipients: data.recipients,
  });

  return { ...emailBlast, ...data };
}

export async function deleteEmailBlast(eventId: string, emailBlastId: string) {
  const emailBlastSnap = await db.eventEmailBlast(eventId, emailBlastId).get();
  const emailBlast = emailBlastSnap.data();

  if (!emailBlast) throw new Response("Email blast not found.", { status: 404 });
  if (emailBlast.status !== "draft") {
    throw new Response("Can only delete draft email blasts.", { status: 400 });
  }

  await db.eventEmailBlast(eventId, emailBlastId).delete();

  return { success: true };
}

export async function sendTestEmail(
  eventId: string,
  emailBlastId: string,
  testEmail: string,
  recipientType: "organization" | "student",
  recipientId: string
) {
  const emailBlastSnap = await db.eventEmailBlast(eventId, emailBlastId).get();
  const emailBlast = emailBlastSnap.data();

  if (!emailBlast) throw new Response("Email blast not found.", { status: 404 });

  let variables: Record<string, string | undefined>;

  if (recipientType === "organization") {
    const orgSnap = await db.org(recipientId).get();
    const org = orgSnap.data();
    if (!org) throw new Response("Organization not found.", { status: 404 });

    const eventOrgSnap = await db.eventOrg(eventId, recipientId).get();
    const eventOrg = eventOrgSnap.data();
    if (!eventOrg) throw new Response("Event organization not found.", { status: 404 });

    const orgWithEvent = { ...eventOrg, ...org };
    variables = buildOrganizationVariables(orgWithEvent);
  } else {
    const studentSnap = await db.eventStudent(eventId, recipientId).get();
    const student = studentSnap.data();
    if (!student) throw new Response("Student not found.", { status: 404 });

    let org: OrganizationWithEvent | undefined;
    if (student.org) {
      const orgSnap = await db.org(student.org.id).get();
      const eventOrgSnap = await db.eventOrg(eventId, student.org.id).get();
      const orgData = orgSnap.data();
      const eventOrgData = eventOrgSnap.data();
      if (orgData && eventOrgData) {
        org = { ...eventOrgData, ...orgData };
      }
    }

    variables = buildStudentVariables(student, org);
  }

  const subject = renderTemplate(emailBlast.subject, variables);
  const markdownContent = renderTemplate(emailBlast.content, variables);
  const htmlContent = await renderMarkdownToHtml(markdownContent);

  await resend.emails.send({
    from: "Berkeley Math Tournament <team@berkeley.mt>",
    to: testEmail,
    subject: `[TEST] ${subject}`,
    html: htmlContent,
  });

  return { success: true };
}

function buildOrganizationVariables(org: OrganizationWithEvent) {
  return {
    "org.name": org.name,
    "org.address": org.address,
    "org.city": org.city,
    "org.state": org.state,
    "org.country": org.country,
    "org.zip": org.zip,
    "org.coach.fname": org.adminData.fname,
    "org.coach.lname": org.adminData.lname,
    "org.coach.email": org.adminData.email,
  };
}

function buildStudentVariables(student: EventStudent, org?: OrganizationWithEvent) {
  return {
    "student.fname": student.fname,
    "student.lname": student.lname,
    "student.email": student.email,
    "student.grade": student.grade?.toString() ?? "",
    "student.number": student.number ?? "",
    "student.org.name": org?.name,
    "student.org.address": org?.address,
    "student.org.city": org?.city,
    "student.org.state": org?.state,
    "student.org.country": org?.country,
    "student.org.zip": org?.zip,
    "student.org.coach.fname": org?.adminData.fname,
    "student.org.coach.lname": org?.adminData.lname,
    "student.org.coach.email": org?.adminData.email,
  };
}

async function getEventOrgsAndStudents(eventId: string) {
  const eventOrgsSnap = await db.eventOrgs(eventId).get();
  const eventOrgs = new Map(eventOrgsSnap.docs.map((x) => [x.id, x.data()]));

  const orgsSnap = await db.orgs.get();
  const orgs = orgsSnap.docs.flatMap((x) => {
    const eventOrg = eventOrgs.get(x.id);
    if (!eventOrg) return [];
    return { ...eventOrg, ...x.data() };
  });

  const studentsSnap = await db.eventStudents(eventId).get();
  const students = studentsSnap.docs.map((x) => x.data());

  return { orgs, students };
}

function buildRecipients(
  emailBlast: EmailBlast,
  orgs: OrganizationWithEvent[],
  students: EventStudent[]
): EmailRecipient[] {
  const recipients: EmailRecipient[] = [];

  if (emailBlast.recipients === "organizations" || emailBlast.recipients === "both") {
    for (const org of orgs) {
      recipients.push({
        email: org.adminData.email,
        variables: buildOrganizationVariables(org),
      });
    }
  }

  if (emailBlast.recipients === "students" || emailBlast.recipients === "both") {
    for (const student of students) {
      const org = student.org ? orgs.find((o) => o.id === student.org?.id) : undefined;
      recipients.push({
        email: student.email,
        variables: buildStudentVariables(student, org),
      });
    }
  }

  return recipients;
}

export async function sendEmailBlast(eventId: string, emailBlastId: string) {
  const emailBlastSnap = await db.eventEmailBlast(eventId, emailBlastId).get();
  const emailBlast = emailBlastSnap.data();

  if (!emailBlast) throw new Response("Email blast not found.", { status: 404 });

  await db.eventEmailBlast(eventId, emailBlastId).update({
    status: "sending",
  });

  const { orgs, students } = await getEventOrgsAndStudents(eventId);
  const recipients = buildRecipients(emailBlast, orgs, students);

  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    try {
      const subject = renderTemplate(emailBlast.subject, recipient.variables);
      const markdownContent = renderTemplate(emailBlast.content, recipient.variables);
      const htmlContent = await renderMarkdownToHtml(markdownContent);

      await resend.emails.send({
        from: "Berkeley Math Tournament <team@berkeley.mt>",
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

  await db.eventEmailBlast(eventId, emailBlastId).update({
    status: failedCount > 0 ? "failed" : "sent",
    sentAt: FieldValue.serverTimestamp(),
    totalRecipients: recipients.length,
    sentCount,
    failedCount,
  });

  return { success: true, sentCount, failedCount };
}

export async function previewEmailBlast(
  eventId: string,
  emailBlastId: string,
  recipientType: "organization" | "student",
  recipientId: string
) {
  const emailBlastSnap = await db.eventEmailBlast(eventId, emailBlastId).get();
  const emailBlast = emailBlastSnap.data();

  if (!emailBlast) throw new Response("Email blast not found.", { status: 404 });

  if (recipientType === "organization") {
    const orgSnap = await db.org(recipientId).get();
    const org = orgSnap.data();
    if (!org) throw new Response("Organization not found.", { status: 404 });

    // Need to get EventOrganization data as well
    const eventOrgSnap = await db.eventOrg(eventId, recipientId).get();
    const eventOrg = eventOrgSnap.data();
    if (!eventOrg) throw new Response("Event organization not found.", { status: 404 });

    const orgWithEvent = { ...eventOrg, ...org };
    const variables = buildOrganizationVariables(orgWithEvent);

    return {
      recipientType,
      recipientId,
      recipientName: org.name,
      recipientEmail: org.adminData.email,
      subject: renderTemplate(emailBlast.subject, variables),
      content: renderTemplate(emailBlast.content, variables),
    };
  } else {
    const studentSnap = await db.eventStudent(eventId, recipientId).get();
    const student = studentSnap.data();
    if (!student) throw new Response("Student not found.", { status: 404 });

    let org: OrganizationWithEvent | undefined;
    if (student.org) {
      const orgSnap = await db.org(student.org.id).get();
      const eventOrgSnap = await db.eventOrg(eventId, student.org.id).get();
      const orgData = orgSnap.data();
      const eventOrgData = eventOrgSnap.data();
      if (orgData && eventOrgData) {
        org = { ...eventOrgData, ...orgData };
      }
    }

    const variables = buildStudentVariables(student, org);

    return {
      recipientType,
      recipientId,
      recipientName: `${student.fname} ${student.lname}`,
      recipientEmail: student.email,
      subject: renderTemplate(emailBlast.subject, variables),
      content: renderTemplate(emailBlast.content, variables),
    };
  }
}
