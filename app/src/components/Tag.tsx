import React, { ReactNode } from 'react';
import './Tag.css';

interface TagProps {
  title: number | string;
  data: ReactNode;
  icon?: ReactNode;
}

function Tag(props: TagProps) {
  return (
    <div className="tag">
      {props.icon && <div className="icon">{props.icon}</div>}
      <div className="info">
        <div className="title">{props.title}</div>

        {props.data}
      </div>
    </div>
  );
}

export default Tag;
