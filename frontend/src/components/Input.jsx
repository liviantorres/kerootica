import '../components/styles/Input.css';

export function Input({ label, type, value, onChange, placeholder, required, icon }) {
  return (
    <div className="input-container">
      {label && <label>{label}</label>}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="input-field"
        />
      </div>
    </div>
  );
}