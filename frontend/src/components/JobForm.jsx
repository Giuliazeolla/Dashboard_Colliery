import React from "react";
import Select from "react-select";

export default function JobForm({
  workers,
  machines,
  activities,
  selected,
  onChange,
  onMultiSelectChange,
  onSubmit,
  loadingSave,
  submitText = "Salva Commessa",
  isEditing = false, 
  onDelete,// uso la prop isEditing con valore di default false
}) {
  const formTitle = isEditing ? "Modifica Commessa" : "Crea Nuova Commessa";

  return (
    <div className="centered-container">
      <form onSubmit={onSubmit} className="create-job-card">
        <h2>{formTitle}</h2>

        <div className="form-container">
          <label htmlFor="title">Titolo:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={selected.title}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-container">
          <label>Operai:</label>
          <Select
            isMulti
            name="worker"
            options={workers}
            value={selected.worker}
            onChange={(selectedOptions) =>
              onMultiSelectChange("worker", selectedOptions)
            }
            classNamePrefix="react-select"
          />
        </div>

        <div className="form-container">
          <label>Macchine:</label>
          <Select
            isMulti
            name="machine"
            options={machines}
            value={selected.machine}
            onChange={(selectedOptions) =>
              onMultiSelectChange("machine", selectedOptions)
            }
            classNamePrefix="react-select"
          />
        </div>

        <div className="form-container">
          <label>Attività:</label>
          <Select
            isMulti
            name="activity"
            options={activities}
            value={selected.activity}
            onChange={(selectedOptions) =>
              onMultiSelectChange("activity", selectedOptions)
            }
            classNamePrefix="react-select"
          />
        </div>

        <div className="form-container">
          <label htmlFor="location">Località:</label>
          <input
            type="text"
            id="location"
            name="location"
            value={selected.location}
            onChange={onChange}
          />
        </div>

        <div className="form-container">
          <label htmlFor="startDate">Data Inizio:</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={selected.startDate}
            onChange={onChange}
          />
        </div>

        <div className="form-container">
          <label htmlFor="endDate">Data Fine:</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={selected.endDate}
            onChange={onChange}
          />
        </div>

        <button type="submit" disabled={loadingSave}>
          {loadingSave
            ? "Salvataggio..."
            : isEditing
            ? "Aggiorna Commessa"
            : submitText}
        </button>

        {isEditing && (
          <button type="button" onClick={onDelete} className="delete-button">
            Elimina Commessa
          </button>
        )}
      </form>
    </div>
  );
}
