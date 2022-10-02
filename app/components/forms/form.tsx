/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { FormProps } from "remix-forms";
import type { SomeZodObject } from "zod";

import { Form as RemixForm } from "remix-forms";

import Checkbox from "~/components/forms/checkbox";
import CheckboxWrapper from "~/components/forms/checkbox-wrapper";
import Field from "~/components/forms/field";
import FieldErrors from "~/components/forms/field-errors";
import GlobalErrors from "~/components/forms/global-errors";
import Input from "~/components/forms/input";
import Label from "~/components/forms/label";
import Select from "~/components/forms/select";
import SubmitButton from "~/components/forms/submit-button";
import TextArea from "~/components/forms/text-area";

export default function Form<Schema extends SomeZodObject>(props: FormProps<Schema>) {
  return (
    <RemixForm<Schema>
      className="flex flex-col gap-5"
      fieldComponent={Field}
      globalErrorsComponent={GlobalErrors}
      fieldErrorsComponent={FieldErrors}
      labelComponent={Label}
      inputComponent={Input}
      multilineComponent={TextArea}
      selectComponent={Select}
      checkboxComponent={Checkbox}
      checkboxWrapperComponent={CheckboxWrapper}
      buttonComponent={SubmitButton}
      {...props}
    />
  );
}
