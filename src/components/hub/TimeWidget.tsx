/**
 * TimeWidget Component
 * A beautiful retro digital watch design showing current time
 * 1x1 widget for the Hub dashboard
 */

import { useState, useEffect } from 'react';
import styled from 'styled-components';

const StyledWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .watch {
    position: relative;
    transform: scale(0.42);
  }
  
  .watch::after,
  .watch::before {
    content: "";
    width: 10rem;
    height: 160px;
    background: radial-gradient(circle at 200px, rgb(0, 0, 0), rgb(48, 48, 48));
    box-shadow: inset 0px -10px 18px #ffffffb9, 10px 0px 30px #00000071;
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0%);
  }
  
  .watch::before {
    content: "";
    width: 10rem;
    height: 160px;
    background: radial-gradient(circle at 200px, rgb(0, 0, 0), rgb(48, 48, 48));
    box-shadow: inset 0px 10px 18px #ffffffb9, 10px 0px 30px #00000071;
    position: absolute;
    left: 50%;
    transform: translate(-50%, -100%);
  }
  
  .dots {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translate(-50%, 140%);
    padding: 3px;
    z-index: 20;
  }
  
  .dots .dot {
    width: 14px;
    aspect-ratio: 1;
    background-color: #000000;
    border-radius: 100px;
    display: block;
    margin-bottom: 40px;
    box-shadow: inset 2px 0 5px #ffffff48;
  }
  
  .frame {
    background: #0d0d0d;
    border-radius: 72px;
    box-shadow: inset 0 0 24px 1px #0d0d0d, inset 0 0 0 10px #606c78,
      0 20px 30px #00000071;
    height: 300px;
    margin: 0 16px;
    padding: 20px 20px;
    position: relative;
    width: 16rem;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
  
  .text {
    color: #dddf8f;
    font-size: 7rem;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace;
    font-weight: 900;
    line-height: 0.85;
    text-shadow: 0 0 40px #d7d886c7;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  
  .time-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .colon {
    font-size: 5rem;
    margin-bottom: 8px;
    animation: blink 1s infinite;
  }
  
  @keyframes blink {
    0%, 49% {
      opacity: 1;
    }
    50%, 100% {
      opacity: 0.3;
    }
  }
  
  .frame::before {
    border: 1px solid #0d0d0d;
    border-radius: 60px;
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.5),
      inset 0 0 12px 2px rgba(255, 255, 255, 0.75);
    content: "";
    height: 280px;
    left: 10px;
    position: absolute;
    top: 10px;
    width: calc(16rem - 20px);
  }
  
  .sideBtn {
    background: #606c78;
    border-left: 1px solid #000;
    border-radius: 8px 6px 6px 8px / 20px 6px 6px 20px;
    box-shadow: inset 8px 0 8px 0 #1c1f23, inset -2px 0 6px #272c31,
      -4px 0 8px #0d0d0d40;
    height: 56px;
    position: absolute;
    right: 4px;
    top: 80px;
    width: 14px;
    z-index: 9;
  }
  
  .sideBtn::before {
    background: #272c31;
    border-radius: 20%;
    box-shadow: 0 -24px rgba(62, 70, 77, 0.75), 0 -21px #272c31, 0 -19px #000,
      0 -15px rgba(62, 70, 77, 0.75), 0 -12px #272c31, 0 -10px #000,
      0 -6px rgba(62, 70, 77, 0.75), 0 -3px #272c31, 0 -1px #000,
      0 3px rgba(62, 70, 77, 0.75), 0 6px #272c31, 0 8px #000,
      0 12px rgba(62, 70, 77, 0.75), 0 15px #272c31, 0 17px #000,
      0 21px rgba(62, 70, 77, 0.75), 0 24px #272c31, 0 26px #000;
    content: "";
    height: 3px;
    margin-top: -2px;
    position: absolute;
    right: 2px;
    top: 50%;
    width: 8px;
    z-index: 9;
  }
  
  .sideBtn::after {
    background: #16181b;
    border-radius: 2px 4px 4px 2px / 20px 8px 8px 20px;
    box-shadow: inset -2px 0 2px 0 #000, inset -6px 0 18px #272c31;
    content: "";
    height: 56px;
    position: absolute;
    right: 0;
    top: 0;
    width: 5px;
  }

  .powerBtn {
    background: #272c31;
    border-radius: 2px 4px 4px 2px / 2px 8px 8px 2px;
    box-shadow: inset 0 0 2px 1px #101315;
    height: 56px;
    position: absolute;
    right: 14px;
    top: 160px;
    width: 3px;
  }
  
  .date-display {
    font-size: 1.2rem;
    color: #dddf8f80;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace;
    font-weight: 500;
    letter-spacing: 2px;
    margin-top: 12px;
    text-transform: uppercase;
  }
`;

export default function TimeWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const dayName = dayNames[time.getDay()];
  const date = time.getDate();
  const month = monthNames[time.getMonth()];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 rounded-2xl h-full min-h-[180px] flex items-center justify-center">
      <StyledWrapper>
        <div className="watch">
          <div className="frame">
            <div className="text">
              <div className="time-row">
                <span>{hours}</span>
                <span className="colon">:</span>
                <span>{minutes}</span>
              </div>
            </div>
            <div className="date-display">
              {dayName} {date} {month}
            </div>
          </div>
          <div className="sideBtn" />
          <div className="powerBtn" />
          <div className="dots">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      </StyledWrapper>
    </div>
  );
}


