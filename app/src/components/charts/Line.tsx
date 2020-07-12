import React from 'react';
import sparkline from '@fnando/sparkline';
import './Line.css';

interface LineProps {
  points: Array<any>;
}

function Line(props: LineProps) {
  document.querySelectorAll('.sparkline').forEach(function (svg) {
    sparkline(svg, props.points, {});
  });

  return (
    <svg className="sparkline" width="1200" height="80" strokeWidth="1"></svg>
  );
}

export default Line;
