import { useState } from 'react';
import styled from 'styled-components';

const StyledWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  .button-stack {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }

  .counter {
    position: absolute;
    top: -26px;
    color: rgb(150, 50, 60);
    font-size: 12px;
    font-weight: 700;
    line-height: 1.2;
    pointer-events: none;
  }

  .btn-class-name {
    --primary: 255, 90, 120;
    --secondary: 150, 50, 60;
    width: 60px;
    height: 50px;
    border: none;
    outline: none;
    cursor: pointer;
    user-select: none;
    touch-action: manipulation;
    outline: 10px solid rgb(var(--primary), 0.5);
    border-radius: 100%;
    position: relative;
    transition: 0.3s;
  }

  .btn-class-name .back {
    background: rgb(var(--secondary));
    border-radius: 100%;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }

  .btn-class-name .front {
    background: linear-gradient(
      0deg,
      rgba(var(--primary), 0.6) 20%,
      rgba(var(--primary)) 50%
    );
    box-shadow: 0 0.5em 1em -0.2em rgba(var(--secondary), 0.5);
    border-radius: 100%;
    position: absolute;
    border: 1px solid rgb(var(--secondary));
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.2rem;
    font-weight: 600;
    font-family: inherit;
    transform: translateY(-15%);
    transition: 0.15s;
    color: rgb(var(--secondary));
  }

  .btn-class-name:active .front {
    transform: translateY(0%);
    box-shadow: 0 0;
  }
`;

export default function PressButtonWidget() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount((prev) => prev + 1);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-amber-50 to-red-50 dark:from-rose-900/20 dark:via-amber-900/20 dark:to-red-900/20 rounded-2xl h-full min-h-[180px] flex items-center justify-center">
      <StyledWrapper>
        <div className="button-stack">
          <span className="counter">{count}</span>
          <button
            className="btn-class-name"
            aria-label="Press button widget"
            onClick={handleClick}
          >
            <span className="back" />
            <span className="front" />
          </button>
        </div>
      </StyledWrapper>
    </div>
  );
}

