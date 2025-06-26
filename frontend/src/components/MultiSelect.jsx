import { useEffect, useState, useRef } from "react";

function MultiSelect({ label, id, options, selectedValues, toggleValue }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Chiudi dropdown se clicchi fuori
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="multi-select" ref={containerRef}>
      <label htmlFor={id}>{label}:</label>
      <div
        id={id}
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className="multi-select-input"
      >
        {selectedValues.length > 0
          ? selectedValues.join(", ")
          : `Seleziona ${label.toLowerCase()}`}
        <span className="arrow">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <ul
          className="multi-select-dropdown"
          role="listbox"
          aria-multiselectable="true"
        >
          {options.map((option, i) => (
            <li key={i}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => toggleValue(option)}
                  className="Input"
                />
                {option}
              </label>
            </li>
          ))}
        </ul>
      )}

      <style>{`
        .multi-select {
          position: relative;
          margin-bottom: 1rem;
        }
        .multi-select-input {
          border: 1px solid #ccc;
          padding: 6px 12px;
          cursor: pointer;
          user-select: none;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .multi-select-input:focus {
          outline: 2px solid #007bff;
        }
        .arrow {
          margin-left: 8px;
          font-size: 0.7em;
        }
        .multi-select-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          max-height: 150px;
          overflow-y: auto;
          background: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-top: 2px;
          z-index: 10;
          padding: 0.25rem 0;
          list-style: none;
        }
        .multi-select-dropdown li {
          padding: 0.25rem 1rem;
        }
        .multi-select-dropdown li label {
          cursor: pointer;
          user-select: none;
          display: flex;
          align-items: center;
        }
        .multi-select-dropdown li input[type="checkbox"] {
          margin-right: 8px;
          width: 50px;
        }
      `}</style>
    </div>
  );
}

export default MultiSelect;
