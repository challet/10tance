"use client";

import GoToUserControl from "./leaflet/GoToUserControl";

/**
 * Site header
 */
export const Header = () => {
  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <h1 className="tn btn-ghost text-xl">10 Tance</h1>
      </div>
      <GoToUserControl className="navabar-end w-auto lg:w-1/2 justify-end" />
    </div>
  );
};
