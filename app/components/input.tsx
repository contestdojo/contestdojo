import type { ForwardedRef } from "react";

import { forwardRef } from "react";

type InputProps = JSX.IntrinsicElements["input"] & {
  label?: string;
};

export default forwardRef(function Input(
  { label, ...props }: InputProps,
  ref: ForwardedRef<HTMLInputElement>
) {
  return (
    <div>
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="mt-1">
        <input
          ref={ref}
          {...props}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
    </div>
  );
});
