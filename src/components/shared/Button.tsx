type Props = {
  children: React.ReactNode;
  className?: string;
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & Props;

export const Button = ({ children, className, ...rest }: ButtonProps) => {
  const buttonClasses = `rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-80 transition-all duration-200 px-6 text-base tracking-custom2 font-medium ${className}`;
  return (
    <button className={buttonClasses} {...rest}>
      {children}
    </button>
  );
};
