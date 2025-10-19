/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { NextApiRequest, NextApiResponse } from "next";

import { firestore, storage, withFirebaseAuth } from "~/helpers/firebase";

const handler = async (req: NextApiRequest, res: NextApiResponse, context: { uid: string }) => {
  if (req.method !== "POST") return res.status(405).end();

  const { eventId, entityType, entityId, fieldId, fileData, fileName } = req.body;
  
  if (typeof eventId !== "string") return res.status(400).json({ error: "eventId is required" });
  if (typeof entityType !== "string") return res.status(400).json({ error: "entityType is required" });
  if (typeof entityId !== "string") return res.status(400).json({ error: "entityId is required" });
  if (typeof fieldId !== "string") return res.status(400).json({ error: "fieldId is required" });
  if (typeof fileData !== "string") return res.status(400).json({ error: "fileData is required" });

  const extension = fileName ? fileName.split(".").pop() : "bin";
  const filePath = `events/${eventId}/custom-fields/${entityType}/${entityId}/${fieldId}.${extension}`;
  
  const file = storage.file(filePath);
  const buffer = Buffer.from(fileData.replace(/^data:[^;]+;base64,/, ""), "base64");
  
  const mimeMatch = fileData.match(/^data:([^;]+);base64,/);
  const contentType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  
  await file.save(buffer, { contentType });

  const entityRef = firestore
    .collection("events")
    .doc(eventId)
    .collection(entityType)
    .doc(entityId);
  
  await entityRef.update({
    [`customFields.${fieldId}`]: filePath,
  });

  res.status(200).json({ filePath });
};

export default withFirebaseAuth(handler);
