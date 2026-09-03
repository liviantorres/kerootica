import '../components/styles/Input.css';

export function Input({ label, type, value, onChange }) {
  return (
    <div className="input-container">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="input-field"
      />
    </div>
  );
}