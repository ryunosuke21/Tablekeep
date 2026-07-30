import type { ComponentProps } from "react";

export function D20Icon(props: ComponentProps<"svg">) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" fill="none" {...props}>
      <path
        d="M32 3 57 20 52 49 32 61 12 49 7 20 32 3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="m32 3 11 18 14-1M32 3 21 21 7 20m50 0L43 43l9 6M7 20l14 23-9 6m9-28h22L32 43 21 21Zm0 22h22l-11 18L21 43Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        opacity="0.55"
      />
    </svg>
  );
}
