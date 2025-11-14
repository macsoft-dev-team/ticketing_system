import React, { useState } from "react";

const Tabs = ({ defaultValue, children, className = "" }) => {
  const [active, setActive] = useState(defaultValue);
  // Filter children by type for rendering
  const list = React.Children.toArray(children).find(child => child.type.displayName === "TabsList");
  const contents = React.Children.toArray(children).filter(child => child.type.displayName === "TabsContent");
  return (
    <div className={className}>
      {list && React.cloneElement(list, { active, setActive })}
      {contents.map(content =>
        React.cloneElement(content, { active })
      )}
    </div>
  );
};

const TabsList = ({ children, active, setActive, className = "" }) => (
  <div className={className}>
    {React.Children.map(children, child =>
      React.cloneElement(child, { active, setActive })
    )}
  </div>
);
TabsList.displayName = "TabsList";

const TabsTrigger = ({ value, children, active, setActive, className = "" }) => (
  <button
    className={`px-4 py-2 text-nowrap uppercase text-sm font-medium border-b-2 transition-colors cursor-pointer ${
      active === value
        ? "border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300"
        : "border-transparent text-gray-500 dark:text-gray-400"
    } ${className}`}
    onClick={() => setActive(value)}
    type="button"
  >
    {children}
  </button>
);
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = ({ value, children, active, className = "" }) => {
  if (active !== value) return null;
  return <div className={className}>{children}</div>;
};
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
