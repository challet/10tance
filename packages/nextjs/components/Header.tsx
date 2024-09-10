import { useState } from "react";
import Image from "next/image";
import GoToUserControl from "./leaflet/GoToUserControl";
import linkIcon from "~~/public/icons/external-link-arrow.svg";

/**
 * Site header
 */
export const Header = () => {
  const [tooltipOpen, setTooltipOpen] = useState<boolean>(false);
  const toggleTooltip = () => {
    setTooltipOpen(!tooltipOpen);
  };
  const resetTooltip = () => {
    setTooltipOpen(false);
  };

  return (
    <div
      className="navbar bg-base-100 p-0 flex-wrap items-center justify-around lg:justify-between shadow-md shadow-secondary h-full"
      onMouseLeave={resetTooltip}
    >
      <div className="navbar-start justify-around lg:justify-start max-w-[50%] w-auto order-1">
        <Image
          className="aspect-square size-16 p-0 hidden xs:[display:initial] ml-2 "
          src="/logo.svg"
          alt="10 tance donut logo"
          width={64}
          height={64}
        />
        <h1 className="inline-block align-middle m-0 font-medium h-full leading-[4rem] text-2xl ml-3">10tance</h1>
        <div className="inline-block relative ml-3">
          <button className="btn btn-circle btn-outline size-4 min-h-4 text-xs leading-3" onClick={toggleTooltip}>
            ?
          </button>
          <div
            className={`${tooltipOpen ? "block" : "hidden"} absolute top-[calc(100%+0.4rem)] -left-6 border border-base-400 bg-base-200 px-4 shadow-md shadow-secondary text-sm max-w-50`}
          >
            <div className="left-9 absolute top-0 transform -translate-y-1/2 rotate-45 w-4 h-4 border-l border-t border-base-400  bg-base-200"></div>
            <p>A virtual world built with data from an EVM blockchain. See more :</p>
            <ul className="list-[initial] list-inside text-nowrap my-4 pr-2">
              <li>
                <a href="https://github.com/challet/10tance" className="text-[revert] underline">
                  {/* eslint-disable @next/next/no-img-element */}
                  Github repository <img src={linkIcon.src} className="size-3 inline" alt="external link hint" />
                </a>
              </li>
              <li>
                <a href="https://ethglobal.com/showcase/10tance-ggf1f" className="text-[revert] underline">
                  {/* eslint-disable @next/next/no-img-element */}
                  ETHGlobal project page <img src={linkIcon.src} className="size-3 inline" alt="external link hint" />
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/clementhallet/" className="text-[revert] underline">
                  {/* eslint-disable @next/next/no-img-element */}
                  Author <img src={linkIcon.src} className="size-3 inline" alt="external link hint" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="navbar-center inline-block text-center font-light leading-initial lg:leading-[4rem] text-xl w-full lg:w-auto order-3 lg:order-2">
        <span>
          showing <em>ERC20</em> objects from the <em>Optimism</em> chain
        </span>
      </div>
      <GoToUserControl className="navabar-end justify-center lg:justify-end max-w-[50%] order-2 lg:order-3" />
    </div>
  );
};
