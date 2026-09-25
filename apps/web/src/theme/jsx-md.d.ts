import type { DetailedHTMLProps, HTMLAttributes } from "react";

type MdProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  disabled?: boolean;
  label?: string;
  value?: string;
  type?: string;
  href?: string;
  "trailing-icon"?: boolean;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "md-filled-button": MdProps;
      "md-text-button": MdProps;
      "md-icon-button": MdProps;
      "md-outlined-text-field": MdProps & {
        rows?: number;
        placeholder?: string;
      };
      "md-circular-progress": MdProps & {
        indeterminate?: boolean;
      };
      "md-assist-chip": MdProps & {
        label?: string;
      };
    }
  }
}

export {};
