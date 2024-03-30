/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import clsx from "clsx";
import { useState } from "react";

function getButtonClasses(
  index: number,
  currentIndex: number,
  canChangeStep: (currentIndex: number, toIndex: number) => boolean
) {
  const canChange = canChangeStep(currentIndex, index) && index !== currentIndex;
  if (index <= currentIndex)
    return clsx`border-indigo-600 ${canChange ? "hover:border-indigo-800" : "cursor-not-allowed"}`;
  return clsx`border-gray-200 ${canChange ? "hover:border-gray-300" : "cursor-not-allowed"}`;
}

function getLabelClasses(
  index: number,
  currentIndex: number,
  canChangeStep: (currentIndex: number, toIndex: number) => boolean
) {
  const canChange = canChangeStep(currentIndex, index) && index !== currentIndex;
  if (index <= currentIndex) return clsx`text-indigo-600 ${canChange && "hover:text-indigo-800"}`;
  return clsx`text-gray-500 ${canChange && "hover:text-gray-700"}`;
}

type StepsProps = {
  labels: string[];
  canChangeStep: (currentIndex: number, toIndex: number) => boolean;
  children: (steps: JSX.Element, index: number, setIndex: (index: number) => void) => JSX.Element;
};

export default function Steps({ labels, canChangeStep, children }: StepsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const steps = (
    <nav aria-label="Progress">
      <ol className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {labels.map((label, index) => (
          <li className="md:flex-1" key={index}>
            <button
              className={clsx`group flex w-full flex-col border-l-4 py-2 pl-4 ${getButtonClasses(
                index,
                currentIndex,
                canChangeStep
              )} md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4`}
              disabled={!canChangeStep(currentIndex, index)}
              onClick={() => setCurrentIndex(index)}
            >
              <span
                className={clsx`text-sm font-medium ${getLabelClasses(
                  index,
                  currentIndex,
                  canChangeStep
                )}`}
              >
                Step {index + 1}
              </span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );

  return children(steps, currentIndex, setCurrentIndex);
}
