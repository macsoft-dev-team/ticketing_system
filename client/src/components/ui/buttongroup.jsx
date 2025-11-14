 
const ButtonGroup = ({ children, className = "", ...props }) => {
  return (
    <div className={`inline-flex gap-2 ${className}`} {...props}>
      {children}
    </div>
  );
};

export { ButtonGroup };
