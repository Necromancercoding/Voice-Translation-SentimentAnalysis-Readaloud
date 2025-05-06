import React from "react";

export const LANGUAGES = [
  { code: "auto", name: "Auto-Detect" },
  { code: "en",  name: "English"    },
  { code: "hi",  name: "Hindi"      },
  { code: "bn",  name: "Bengali"    },
  { code: "ta",  name: "Tamil"      },
  { code: "mr",  name: "Marathi"    },
  { code: "gu",  name: "Gujarati"   },
  { code: "es",  name: "Spanish"    },
  { code: "fr",  name: "French"     },
  { code: "de",  name: "German"     },
  { code: "ru",  name: "Russian"    },
  { code: "zh",  name: "Chinese"    },
];

export default function LanguageSelector({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      {LANGUAGES.map(l => (
        <option key={l.code} value={l.code}>
          {l.name}
        </option>
      ))}
    </select>
  );
}
