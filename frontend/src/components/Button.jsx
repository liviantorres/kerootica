import '../components/styles/Button.css';

export function Button({children, type = "button", disabled}){
    return (
        <button
            type={type}
            disabled={disabled}
            className="btn-primary"
        >
            {children}
        </button>
    )
}