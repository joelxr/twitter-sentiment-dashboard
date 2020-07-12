import React, { useState } from 'react';
import Sentiment from 'sentiment';

import { Sample } from './types';

import Tag from './components/Tag';
import Line from './components/charts/Line';
import Pie from './components/charts/Pie';

import {
  TwitterIcon,
  SentimentsIcon,
  EnglishIcon,
  NegativeIcon,
  PositiveIcon,
} from './components/icons';

import './App.css';

interface AppProps {}

const socket = new WebSocket('ws://localhost:4000', 'tcp');
const sentiment = new Sentiment();
const points: Array<any> = [];
const mode = {};
const langs = {};
const wordsMap = {};

function App({}: AppProps) {
  const [tweetsCount, setTweetsCount] = useState(0);
  const [englishTweetsCount, setEnglishTweetsCount] = useState(0);
  const [sumScore, setSumScore] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [mostPositive, setMostPositive] = useState<Sample>(null);
  const [mostNegative, setMostNegative] = useState<Sample>(null);
  const [scoreDistribution, setScoreDistribution] = useState([]);
  const [langDistribution, setLangDistribution] = useState([]);
  const [wordsDistribution, setWordsDistribution] = useState([]);
  const [edgeWords, setEdgeWords] = useState([]);

  socket.onmessage = (event) => {
    try {
      const { data } = JSON.parse(event.data);
      onNewSample(data);
    } catch (err) {}
  };

  function collectEdgeWords(calculation) {
    if (calculation.length) {
      const result = calculation.reduce((a, calc) => {
        const val = Object.values(calc)[0];

        if (typeof a[0] === 'undefined') {
          a[0] = calc;
        } else {
          const lowerEdge = Object.values(a[0])[0];
          if (val < lowerEdge) a[0] = calc;
        }

        if (typeof a[1] === 'undefined') {
          a[1] = calc;
        } else {
          const higherEdge = Object.values(a[1])[0];
          if (val > higherEdge) a[1] = calc;
        }

        return a;
      }, []);

      const edges = [...edgeWords];

      if (typeof edges[0] === 'undefined') {
        edges[0] = result[0];
      } else {
        const lowerEdge = Object.values(edges[0])[0];
        const resultLowerEdge = Object.values(result[0])[0];
        if (resultLowerEdge < lowerEdge) edges[0] = result[0];
      }

      if (typeof edges[1] === 'undefined') {
        edges[1] = result[1];
      } else {
        const higherEdge = Object.values(edges[1])[0];
        const resultHigherEdge = Object.values(result[1])[0];
        if (resultHigherEdge > higherEdge) edges[1] = result[1];
      }

      setEdgeWords(edges);
    }
  }

  function collectLangFrquency(sample) {
    const { lang } = sample;
    if (typeof langs[lang] === 'undefined') {
      langs[lang] = 1;
    } else {
      langs[lang] = langs[lang] + 1;
    }

    setLangDistribution(
      Object.keys(langs).reduce((a, lang) => {
        const total = Object.keys(langs).reduce((a, c) => {
          a = a + langs[c];
          return a;
        }, 0);

        const frequency = langs[lang];
        const ratio = frequency / total;

        a.push({
          value: (ratio * 100).toFixed(2),
          desc: lang,
        });
        return a;
      }, [])
    );
  }

  function collectScoreFrequency(sample) {
    const { score } = sample;
    if (typeof mode[score] === 'undefined') {
      mode[score] = 1;
    } else {
      mode[score] = mode[score] + 1;
    }

    setScoreDistribution(
      Object.keys(mode).reduce((a, score) => {
        const total = Object.keys(mode).reduce((a, c) => {
          a = a + mode[c];
          return a;
        }, 0);

        const frequency = mode[score];
        const ratio = frequency / total;

        a.push({
          value: (ratio * 100).toFixed(2),
          desc: score,
        });
        return a;
      }, [])
    );
  }

  function collectWordsFrequency(words) {
    words.map((w) => {
      if (typeof wordsMap[w] === 'undefined') {
        wordsMap[w] = 1;
      } else {
        wordsMap[w] = wordsMap[w] + 1;
      }
    });

    setWordsDistribution(
      Object.keys(wordsMap).reduce((a, word) => {
        const total = Object.keys(wordsMap).reduce((a, c) => {
          a = a + wordsMap[c];
          return a;
        }, 0);

        const frequency = wordsMap[word];
        const ratio = frequency / total;

        a.push({
          value: (ratio * 100).toFixed(2),
          desc: word,
        });
        return a;
      }, [])
    );
  }

  function collectScorePoints(sample) {
    const { score } = sample;

    if (points.length > 500) {
      points.shift();
    }

    points.push(score);
  }

  function collectScoreTotalAndAverage(sample) {
    const { score } = sample;
    setSumScore(sumScore + score);

    if (sumScore && englishTweetsCount) {
      var avg = sumScore / englishTweetsCount;
      setAvgScore(avg);
    }
  }

  function collectMostNegative(sample) {
    if (!mostNegative || sample.score < mostNegative.score) {
      setMostNegative(sample);
    }
  }

  function collectMostPositive(sample) {
    if (!mostPositive || sample.score > mostPositive.score) {
      setMostPositive(sample);
    }
  }

  function onNewSample(sample: Sample) {
    setTweetsCount(tweetsCount + 1);
    collectLangFrquency(sample);

    if (sample.lang === 'en') {
      setEnglishTweetsCount(englishTweetsCount + 1);
      const { score, calculation, words } = sentiment.analyze(sample.text);
      sample.score = score;

      if (sample.score !== 0) {
        collectScoreFrequency(sample);
        collectWordsFrequency(words);
        collectScoreTotalAndAverage(sample);
        collectScorePoints(sample);
        collectMostNegative(sample);
        collectMostPositive(sample);
        collectEdgeWords(calculation);
      }
    }
  }

  return (
    <div className="grid">
      <div className="col-span-1">
        <Tag
          title="Tweets"
          icon={<TwitterIcon />}
          data={<div className="number">{tweetsCount.toLocaleString()}</div>}
        />
      </div>
      <div className="col-span-1">
        <Tag
          title="English"
          icon={<EnglishIcon />}
          data={
            <div className="number">{englishTweetsCount.toLocaleString()}</div>
          }
        />
      </div>
      <div className="col-span-1">
        <Tag
          title="Sentiment"
          icon={<SentimentsIcon />}
          data={<div className="number">{avgScore.toLocaleString()}</div>}
        />
      </div>
      <div className="col-span-1">
        {edgeWords[1] && (
          <Tag
            title="Most positive word"
            data={
              <div>
                <div>{Object.keys(edgeWords[1])[0]}</div>
                <div>{Object.values(edgeWords[1])[0]}</div>
              </div>
            }
            icon={<PositiveIcon />}
          />
        )}
      </div>
      <div className="col-span-1">
        {edgeWords[0] && (
          <Tag
            title="Most negative word"
            data={
              <div>
                <div>{Object.keys(edgeWords[0])[0]}</div>
                <div>{Object.values(edgeWords[0])[0]}</div>
              </div>
            }
            icon={<NegativeIcon />}
          />
        )}
      </div>
      <div className="col-span-1"></div>
      <div className="col-span-3">
        {mostPositive && (
          <Tag
            title="Most positive tweet"
            data={
              <div className="tweet positive">
                <div className="text">{mostPositive.text}</div>
                <div className="score">+{mostPositive.score}</div>
              </div>
            }
            icon={<PositiveIcon />}
          />
        )}
      </div>
      <div className="col-span-3">
        {mostNegative && (
          <Tag
            title="Most negative tweet"
            data={
              <div className="tweet negative">
                <div className="text">{mostNegative.text}</div>
                <div className="score">{mostNegative.score}</div>
              </div>
            }
            icon={<NegativeIcon />}
          />
        )}
      </div>
      <div className="col-span-6">
        <Tag
          title="Score history"
          data={
            <div>
              <Line points={points} />
            </div>
          }
        />
      </div>
      <div className="col-span-2">
        <Tag title="Language" data={<Pie data={langDistribution} />} />
      </div>
      <div className="col-span-2">
        <Tag title="Frequency" data={<Pie data={scoreDistribution} />} />
      </div>
      <div className="col-span-2">
        <Tag
          title="Words"
          data={<Pie data={wordsDistribution} ignoreLessThan={1} />}
        />
      </div>
    </div>
  );
}

export default App;
