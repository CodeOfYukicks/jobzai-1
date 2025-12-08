import React from 'react';
import styled from 'styled-components';

const StyledWrapper = styled.div`
  /*************/
  /* Variables */
  /*************/
  .btn-container {
    --pupil-color: rgb(156, 207, 255);
    --pupil-move: 20%;
    --sensor-height: 130dvmax;
    --sensor-width: calc(var(--sensor-height) * 82.84 / 100);
  }

  .btn-button {
    --back-color: #fff;
  }

  .btn-lid {
    --back-color: transparent;
  }

  /**********/
  /* Styles */
  /**********/
  /* Container */
  .btn-container {
    position: relative;
    display: flex;
    gap: 1.5rem;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  /* Button */
  .btn-button {
    background: #fff;
    border: 3px solid #000;
    border-radius: 10rem;
    cursor: pointer;
    padding: 2rem;
    position: relative;
    z-index: 100;
  }

  .btn-button:hover,
  .btn-button:hover .btn-lid {
    animation: squint 100ms forwards;
  }

  .btn-button:active .btn-pupil {
    animation: agitate 100ms infinite 500ms;
    border-width: 0.5rem;
    padding: 1rem;
  }

  .btn-lid {
    border-radius: 10rem;
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 101;
  }

  .btn-pupil {
    background: #000;
    border: 0.8rem solid var(--pupil-color);
    border-radius: 10rem;
    padding: 0.7rem;
    transition: all 200ms ease-out;
  }

  /* Button wrapper for individual eye */
  .btn-button-wrapper {
    position: relative;
  }

  /* Sensors */
  .btn-button-wrapper .btn-sensor {
    clip-path: polygon(0 0, 100% 0, 50% 100%, 0 0);
    height: var(--sensor-height);
    left: calc(50% - var(--sensor-width) / 2);
    overflow: hidden;
    position: absolute;
    top: calc(50% - var(--sensor-height) / 2);
    transform: rotate(calc(var(--a) * 1deg))
      translateY(calc(var(--sensor-height) * -50 / 100));
    width: var(--sensor-width);
    z-index: 99;
    pointer-events: auto;
  }

  /************/
  /* Tracking */
  /************/
  .btn-button-wrapper .sensor-n:hover ~ .btn-button .btn-pupil {
    transform: translateX(0) translateY(calc(-3 * var(--pupil-move)));
  }

  .btn-button-wrapper .sensor-ne:hover ~ .btn-button .btn-pupil {
    transform: translateX(calc(2 * var(--pupil-move)))
      translateY(calc(-2 * var(--pupil-move)));
  }

  .btn-button-wrapper .sensor-e:hover ~ .btn-button .btn-pupil {
    transform: translateX(calc(3 * var(--pupil-move))) translateY(0);
  }

  .btn-button-wrapper .sensor-se:hover ~ .btn-button .btn-pupil {
    transform: translateX(calc(2 * var(--pupil-move)))
      translateY(calc(2 * var(--pupil-move)));
  }

  .btn-button-wrapper .sensor-s:hover ~ .btn-button .btn-pupil {
    transform: translateX(0) translateY(calc(3 * var(--pupil-move)));
  }

  .btn-button-wrapper .sensor-sw:hover ~ .btn-button .btn-pupil {
    transform: translateX(calc(-2 * var(--pupil-move)))
      translateY(calc(2 * var(--pupil-move)));
  }

  .btn-button-wrapper .sensor-w:hover ~ .btn-button .btn-pupil {
    transform: translateX(calc(-3 * var(--pupil-move))) translateY(0);
  }

  .btn-button-wrapper .sensor-nw:hover ~ .btn-button .btn-pupil {
    transform: translateX(calc(-2 * var(--pupil-move)))
      translateY(calc(-2 * var(--pupil-move)));
  }

  /**************/
  /* Animations */
  /**************/
  @keyframes agitate {
    0% {
      transform: scale(1.2) translate(0%, -10%);
    }

    25% {
      transform: scale(1.2) translate(-10%, 10%);
    }

    50% {
      transform: scale(1.2) translate(10%, -5%);
    }

    75% {
      transform: scale(1.2) translate(-10%, -5%);
    }

    100% {
      transform: scale(1.2) translate(10%, 10%);
    }
  }

  @keyframes squint {
    0% {
      background: var(--back-color);
    }

    25% {
      background: linear-gradient(
        0deg,
        #000 0% 9%,
        var(--back-color) 10% 90%,
        #000 91% 100%
      );
    }

    50% {
      background: linear-gradient(
        0deg,
        #000 0% 18%,
        var(--back-color) 19% 81%,
        #000 82% 100%
      );
    }

    75% {
      background: linear-gradient(
        0deg,
        #000 0% 27%,
        var(--back-color) 28% 72%,
        #000 73% 100%
      );
    }

    100% {
      background: linear-gradient(
        0deg,
        #000 0% 35%,
        var(--back-color) 36% 64%,
        #000 65% 100%
      );
    }
  }
`;

export default function EyeButtonWidget() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-sky-900/20 rounded-2xl h-full min-h-[180px] flex items-center justify-center">
      <StyledWrapper>
        <div className="btn-container">
          {/* Sensors for first eye */}
          <div className="btn-button-wrapper">
            <div style={{'--a': 0} as React.CSSProperties} className="btn-sensor sensor-n" />
            <div style={{'--a': 45} as React.CSSProperties} className="btn-sensor sensor-ne" />
            <div style={{'--a': 90} as React.CSSProperties} className="btn-sensor sensor-e" />
            <div style={{'--a': 135} as React.CSSProperties} className="btn-sensor sensor-se" />
            <div style={{'--a': 180} as React.CSSProperties} className="btn-sensor sensor-s" />
            <div style={{'--a': 225} as React.CSSProperties} className="btn-sensor sensor-sw" />
            <div style={{'--a': 270} as React.CSSProperties} className="btn-sensor sensor-w" />
            <div style={{'--a': 315} as React.CSSProperties} className="btn-sensor sensor-nw" />
            <button className="btn-button">
              <div className="btn-lid" />
              <div className="btn-pupil" />
            </button>
          </div>
          {/* Sensors for second eye */}
          <div className="btn-button-wrapper">
            <div style={{'--a': 0} as React.CSSProperties} className="btn-sensor sensor-n" />
            <div style={{'--a': 45} as React.CSSProperties} className="btn-sensor sensor-ne" />
            <div style={{'--a': 90} as React.CSSProperties} className="btn-sensor sensor-e" />
            <div style={{'--a': 135} as React.CSSProperties} className="btn-sensor sensor-se" />
            <div style={{'--a': 180} as React.CSSProperties} className="btn-sensor sensor-s" />
            <div style={{'--a': 225} as React.CSSProperties} className="btn-sensor sensor-sw" />
            <div style={{'--a': 270} as React.CSSProperties} className="btn-sensor sensor-w" />
            <div style={{'--a': 315} as React.CSSProperties} className="btn-sensor sensor-nw" />
            <button className="btn-button">
              <div className="btn-lid" />
              <div className="btn-pupil" />
            </button>
          </div>
        </div>
      </StyledWrapper>
    </div>
  );
}

