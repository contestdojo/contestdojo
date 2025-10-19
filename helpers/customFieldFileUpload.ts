/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { CustomField } from "~/components/forms/customFields";

export const processCustomFieldFiles = async (
  customFields: CustomField[],
  formData: any,
  eventId: string,
  entityType: string,
  entityId: string,
  authToken: string
): Promise<{ [key: string]: string }> => {
  const processedFields: { [key: string]: string } = {};

  for (const field of customFields) {
    if (field.type === "file" && formData.customFields?.[field.id]) {
      const fileInput = document.querySelector(`input[name="customFields.${field.id}"]`) as HTMLInputElement;
      
      if (fileInput?.files?.[0]) {
        const file = fileInput.files[0];
        
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const resp = await fetch("/api/upload_custom_field", {
          method: "POST",
          headers: {
            authorization: authToken,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            eventId,
            entityType,
            entityId,
            fieldId: field.id,
            fileData,
            fileName: file.name,
          }),
        });

        if (!resp.ok) {
          throw new Error(`Failed to upload file for ${field.label}`);
        }

        const result = await resp.json();
        processedFields[field.id] = result.filePath;
      } else if (formData.customFields[field.id]) {
        processedFields[field.id] = formData.customFields[field.id];
      }
    } else if (formData.customFields?.[field.id]) {
      processedFields[field.id] = formData.customFields[field.id];
    }
  }

  return processedFields;
};
