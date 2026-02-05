import * as React from "react";
const Player = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={138}
    height={213}
    viewBox="0 0 138 213"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M32 0C33.1046 0 34 0.895431 34 2V12.4951L127 14.5V115H11V0H32ZM127 1V14.5L104 14V3C104 1.89543 104.895 1 106 1H127Z"
      fill="#E5E7F2"
    />
    <path
      d="M102.5 36.5L102.712 48.5H115L113.5 83L103.33 83.4062L103.5 93L36 90L35.624 79.4844L23.5 79L22 44.5H34.375L34 34L102.5 36.5Z"
      fill="#E3C3B9"
    />
    <rect x={46} y={56} width={11} height={11} fill="black" />
    <rect x={80} y={59} width={11} height={11} fill="black" />
    <rect x={11} y={115} width={116} height={13} fill="#0497DA" />
    <path d="M22 148H10V128H0V115H11V128H22V148Z" fill="#59BF38" />
    <path
      d="M127 148H115V128H127V148ZM138 126H127V115H138V126Z"
      fill="#59BF38"
    />
    <path d="M127 168H10V148H22V128H115V148H127V168Z" fill="#0497DA" />
    <rect x={10} y={168} width={117} height={19} fill="#2454B9" />
    <path d="M32 187H59V213H32V187Z" fill="#2454B9" />
    <path d="M32 203.421H59V213H32V203.421Z" fill="#333335" />
    <path d="M77 187H106V213H77V187Z" fill="#2454B9" />
    <path d="M77 203.421H106V213H77V203.421Z" fill="#333335" />
    <rect x={127} y={126} width={11} height={35} fill="#E3C3B9" />
    <rect y={128} width={11} height={35} fill="#E3C3B9" />
  </svg>
);
export default Player;
