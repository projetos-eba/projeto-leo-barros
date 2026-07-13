import type { Appearance } from "@stripe/stripe-js";

export const stripeElementsAppearance: Appearance = {
  theme: "night",
  variables: {
    borderRadius: "8px",
    colorBackground: "#071923",
    colorDanger: "#ff8f84",
    colorPrimary: "#2d9cff",
    colorText: "#f1f6fa",
    colorTextPlaceholder: "#8ca1af",
    fontFamily: "Rethink Sans, ui-sans-serif, system-ui, sans-serif",
    fontSizeBase: "15px",
    spacingUnit: "4px",
  },
  rules: {
    ".Block": {
      backgroundColor: "#071923",
      border: "1px solid #31536a",
      boxShadow: "none",
    },
    ".Input": {
      backgroundColor: "#071923",
      border: "1px solid #31536a",
      boxShadow: "none",
      color: "#f1f6fa",
      padding: "12px",
    },
    ".Input:focus": {
      borderColor: "#2d9cff",
      boxShadow: "0 0 0 1px #2d9cff",
    },
    ".Input--invalid": {
      borderColor: "#ff8f84",
      boxShadow: "0 0 0 1px #ff8f84",
    },
    ".Label": {
      color: "#cbd8e1",
      fontWeight: "600",
    },
    ".Tab": {
      backgroundColor: "#071923",
      border: "1px solid #31536a",
      color: "#cbd8e1",
    },
    ".Tab--selected": {
      borderColor: "#2d9cff",
      color: "#f1f6fa",
    },
  },
};
