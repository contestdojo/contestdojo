/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { NextApiRequest, NextApiResponse } from "next";

import { firestore } from "~/helpers/firebase";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") return res.status(405).end();

  const { eventId, studentId, waiver } = req.body;
  if (typeof eventId !== "string") return res.status(400).end();
  if (typeof studentId !== "string") return res.status(400).end();
  if (typeof waiver !== "string") return res.status(400).end();

  const studentRef = firestore.collection("events").doc(eventId).collection("students").doc(studentId);
  await studentRef.update({ waiver });

  res.status(204).end();
};

export default handler;
