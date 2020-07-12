import React from 'react';
import './Pie.css';

interface PieProps {
  data: any;
  ignoreLessThan?: number;
}

const colors = [];

function randomColor() {
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
  return color;
}

function collectData(props) {
  const { data, ignoreLessThan } = props;
  return data
    .sort((a, b) => {
      return b.value - a.value;
    })
    .reduce((a, c) => {
      if (c.value > (ignoreLessThan ? ignoreLessThan : 5)) {
        a.push(c);
      } else {
        const others = a.find((i) => i.desc === 'Outros');

        if (others) {
          others.value = (Number(others.value) + Number(c.value)).toFixed(2);
        } else
          a.push({
            value: c.value,
            desc: 'Outros',
          });
      }

      return a;
    }, [])
    .map((v, i) => {
      let color = randomColor();

      if (colors[i]) {
        color = colors[i];
      } else {
        colors[i] = color;
      }

      return {
        array: [v.value, 100 - v.value],
        offset: i === 0 ? 25 : 0,
        desc: v.desc,
        color,
        background: color,
      };
    })
    .reduce((a, c, i) => {
      if (c.offset === 0) {
        const prev = a[i - 1];
        let offset = 100 - prev.array[0] + prev.offset;
        if (offset >= 100) offset = offset - 100;
        c.offset = offset;
      }
      a.push(c);
      return a;
    }, []);
}

function Pie(props: PieProps) {
  const values = collectData(props);
  return (
    <div className="pie">
      <div className="chart">
        <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
          <circle
            className="donut-hole"
            cx="21"
            cy="21"
            r="15.91549430918954"
            fill="transparent"
          ></circle>
          <circle
            className="donut-ring"
            cx="21"
            cy="21"
            r="15.91549430918954"
            fill="transparent"
            stroke="#d2d3d4"
            strokeWidth="8"
          ></circle>
          {values.map((v, i) => {
            return (
              <circle
                key={i}
                className="donut-segment"
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke={v.color}
                strokeWidth="8"
                strokeDasharray={`${v.array[0]} ${v.array[1]}`}
                strokeDashoffset={v.offset}
              ></circle>
            );
          })}
        </svg>
      </div>
      <div className="legend">
        {values.map((v, i) => {
          return (
            <div key={i} className="legendItem">
              <div className="disc" style={v}></div>
              <div>{`${v.desc} (${v.array[0]}%)`}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Pie;
