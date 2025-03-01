import React from "react";
import "./Container.css"; // Import styles

const Container = ({ children }) => {
  return <div className="container">{children}</div>;
};

export default Container;
